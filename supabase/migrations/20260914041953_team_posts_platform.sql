create type public.team_post_type as enum ('ctf_result', 'team_update', 'announcement');

create table public.team_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  post_type public.team_post_type not null,
  title text not null check (char_length(title) between 2 and 140),
  excerpt text check (excerpt is null or char_length(excerpt) <= 280),
  body text not null default '' check (char_length(body) <= 30000),
  owner_id uuid not null references auth.users(id) on delete restrict,
  event_id uuid references public.events(id) on delete set null,
  featured boolean not null default false,
  status public.publish_state not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_team_post_has_time check (status <> 'published' or published_at is not null)
);

create table public.team_post_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.team_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  post_type public.team_post_type not null,
  title text not null check (char_length(title) between 2 and 140),
  excerpt text check (excerpt is null or char_length(excerpt) <= 280),
  body text not null default '' check (char_length(body) <= 30000),
  event_id uuid references public.events(id) on delete set null,
  featured boolean not null default false,
  status public.publish_state not null default 'draft',
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index one_working_revision_per_post on public.team_post_revisions(post_id)
  where status in ('draft', 'submitted', 'changes_requested');
create index team_posts_public_feed on public.team_posts(published_at desc)
  where status = 'published';
create index team_posts_owner_updated on public.team_posts(owner_id, updated_at desc);

create table public.team_post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.team_posts(id) on delete cascade,
  revision_id uuid references public.team_post_revisions(id) on delete cascade,
  storage_bucket text not null check (storage_bucket in ('draft-media', 'public-media')),
  storage_path text not null,
  alt_text text not null check (char_length(alt_text) between 1 and 300),
  caption text check (caption is null or char_length(caption) <= 500),
  width integer not null check (width between 1 and 12000),
  height integer not null check (height between 1 and 12000),
  sort_order smallint not null check (sort_order between 0 and 9),
  is_cover boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(storage_bucket, storage_path)
);
create unique index one_live_cover_per_post on public.team_post_media(post_id)
  where is_cover and revision_id is null;
create unique index one_revision_cover_per_post on public.team_post_media(revision_id)
  where is_cover and revision_id is not null;
create index team_post_media_order on public.team_post_media(post_id, revision_id, sort_order);

create table public.team_post_articles (
  post_id uuid not null references public.team_posts(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  primary key (post_id, article_id)
);
create table public.team_post_projects (
  post_id uuid not null references public.team_posts(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  primary key (post_id, project_id)
);

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_team_posts_updated_at before update on public.team_posts
for each row execute function private.set_updated_at();
create trigger set_team_post_revisions_updated_at before update on public.team_post_revisions
for each row execute function private.set_updated_at();

alter table public.team_posts enable row level security;
alter table public.team_post_revisions enable row level security;
alter table public.team_post_media enable row level security;
alter table public.team_post_articles enable row level security;
alter table public.team_post_projects enable row level security;

create policy "published team posts or owned work" on public.team_posts for select
using (status = 'published' or owner_id = (select auth.uid()) or private.current_role() = 'admin');
create policy "members create team post drafts" on public.team_posts for insert to authenticated
with check (owner_id = (select auth.uid()) and status = 'draft' and private.current_role() in ('member','admin'));
create policy "members update owned working posts" on public.team_posts for update to authenticated
using (owner_id = (select auth.uid()) and status in ('draft','changes_requested') and private.current_role() in ('member','admin'))
with check (owner_id = (select auth.uid()) and status in ('draft','submitted') and private.current_role() in ('member','admin'));
create policy "admins manage team posts" on public.team_posts for all to authenticated
using (private.current_role() = 'admin') with check (private.current_role() = 'admin');

create policy "authors see post revisions" on public.team_post_revisions for select to authenticated
using (author_id = (select auth.uid()) or private.current_role() = 'admin');
create policy "authors create post revisions" on public.team_post_revisions for insert to authenticated
with check (author_id = (select auth.uid()) and private.current_role() in ('member','admin'));
create policy "authors update post revisions" on public.team_post_revisions for update to authenticated
using (author_id = (select auth.uid()) and status in ('draft','changes_requested'))
with check (author_id = (select auth.uid()) and status in ('draft','submitted'));
create policy "admins manage post revisions" on public.team_post_revisions for all to authenticated
using (private.current_role() = 'admin') with check (private.current_role() = 'admin');

create policy "public or owned post media" on public.team_post_media for select
using (
  (storage_bucket = 'public-media' and exists(select 1 from public.team_posts p where p.id = post_id and p.status = 'published'))
  or created_by = (select auth.uid()) or private.current_role() = 'admin'
);
create policy "members attach draft media" on public.team_post_media for insert to authenticated
with check (
  created_by = (select auth.uid()) and storage_bucket = 'draft-media'
  and private.current_role() in ('member','admin')
  and exists(select 1 from public.team_posts p where p.id = post_id and (p.owner_id = (select auth.uid()) or private.current_role() = 'admin'))
);
create policy "members edit owned draft media" on public.team_post_media for update to authenticated
using (created_by = (select auth.uid()) and storage_bucket = 'draft-media')
with check (created_by = (select auth.uid()) and storage_bucket = 'draft-media');
create policy "members delete owned draft media" on public.team_post_media for delete to authenticated
using (created_by = (select auth.uid()) and storage_bucket = 'draft-media');
create policy "admins manage post media" on public.team_post_media for all to authenticated
using (private.current_role() = 'admin') with check (private.current_role() = 'admin');

create policy "public post article links" on public.team_post_articles for select
using (exists(select 1 from public.team_posts p where p.id = post_id and p.status = 'published'));
create policy "public post project links" on public.team_post_projects for select
using (exists(select 1 from public.team_posts p where p.id = post_id and p.status = 'published'));
create policy "admins manage post article links" on public.team_post_articles for all to authenticated
using (private.current_role() = 'admin') with check (private.current_role() = 'admin');
create policy "admins manage post project links" on public.team_post_projects for all to authenticated
using (private.current_role() = 'admin') with check (private.current_role() = 'admin');

create policy "owners delete draft media objects" on storage.objects for delete to authenticated
using (bucket_id = 'draft-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

grant select on public.team_posts, public.team_post_media, public.team_post_articles, public.team_post_projects to anon, authenticated;
grant select on public.team_post_revisions to authenticated;
grant insert, update on public.team_posts, public.team_post_revisions to authenticated;
grant insert, update, delete on public.team_post_media to authenticated;
grant all on public.team_post_articles, public.team_post_projects to authenticated;
