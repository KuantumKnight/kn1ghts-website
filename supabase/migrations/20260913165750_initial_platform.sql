create schema if not exists private;

create type public.app_role as enum ('public', 'member', 'admin');
create type public.publish_state as enum ('draft', 'submitted', 'changes_requested', 'published', 'archived');
create type public.moderation_state as enum ('pending', 'approved', 'rejected');

create table public.members (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 100),
  handle text unique not null,
  bio text,
  specialties text[] not null default '{}',
  avatar_url text,
  github_url text,
  linkedin_url text,
  status public.publish_state not null default 'draft',
  display_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.app_role not null default 'public',
  member_id uuid unique references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_role_requires_profile check (role = 'public' or member_id is not null or role = 'admin')
);

create table public.site_settings (
  id boolean primary key default true check (id),
  recruitment_open boolean not null default false,
  security_email text,
  pgp_fingerprint text,
  pgp_public_key text,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (true);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  summary text,
  event_date date,
  placement integer check (placement > 0),
  field_size integer check (field_size > 0),
  source_url text,
  featured boolean not null default false,
  status public.publish_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sourced_published_result check (status <> 'published' or placement is null or source_url is not null)
);

create table public.event_members (
  event_id uuid references public.events(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,
  primary key (event_id, member_id)
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  kind text not null check (kind in ('writeup', 'blog')),
  title text not null check (char_length(title) between 4 and 180),
  excerpt text check (char_length(excerpt) <= 320),
  body text not null check (char_length(body) <= 100000),
  category text,
  event_id uuid references public.events(id) on delete restrict,
  owner_id uuid not null references auth.users(id) on delete restrict,
  status public.publish_state not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint writeup_has_event check (kind <> 'writeup' or event_id is not null or status = 'draft'),
  constraint publish_date_matches_state check ((status = 'published' and published_at is not null) or status <> 'published')
);

create table public.article_authors (
  article_id uuid references public.articles(id) on delete cascade,
  member_id uuid references public.members(id) on delete restrict,
  primary key (article_id, member_id)
);

create table public.article_revisions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  title text not null,
  excerpt text,
  body text not null,
  category text,
  status public.publish_state not null default 'draft' check (status in ('draft','submitted','changes_requested','published','archived')),
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  description text not null,
  repository_url text unique not null,
  technologies text[] not null default '{}',
  stars integer check (stars >= 0),
  stars_updated_at timestamptz,
  status public.publish_state not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_maintainers (
  project_id uuid references public.projects(id) on delete cascade,
  member_id uuid references public.members(id) on delete restrict,
  primary key (project_id, member_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 2000),
  status public.moderation_state not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  area text not null check (area in ('web','pwn','crypto','forensics','osint','operations')),
  experience text not null check (char_length(experience) between 40 and 5000),
  links text check (char_length(links) <= 1000),
  status text not null default 'received' check (status in ('received','reviewing','accepted','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null check (subject in ('general','ctf','research','recruitment')),
  message text not null check (char_length(message) between 20 and 4000),
  status text not null default 'unread' check (status in ('unread','read','resolved','spam')),
  created_at timestamptz not null default now()
);

create table public.editorial_queue (
  id uuid primary key default gen_random_uuid(),
  article_id uuid unique not null references public.articles(id) on delete cascade,
  assigned_member_id uuid references public.members(id) on delete set null,
  target_date date,
  note text,
  created_at timestamptz not null default now()
);

create index articles_public_idx on public.articles (kind, published_at desc) where status = 'published';
create index comments_moderation_idx on public.comments (status, created_at desc);
create index events_public_idx on public.events (event_date desc) where status = 'published';

create or replace function private.current_role()
returns public.app_role language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;
revoke all on function private.current_role() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.current_role() to anon, authenticated;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'user_name'));
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.site_settings enable row level security;
alter table public.events enable row level security;
alter table public.event_members enable row level security;
alter table public.articles enable row level security;
alter table public.article_authors enable row level security;
alter table public.article_revisions enable row level security;
alter table public.projects enable row level security;
alter table public.project_maintainers enable row level security;
alter table public.comments enable row level security;
alter table public.applications enable row level security;
alter table public.contact_messages enable row level security;
alter table public.editorial_queue enable row level security;

create policy "published members are public" on public.members for select using (status = 'published' or private.current_role() = 'admin');
create policy "published events are public" on public.events for select using (status = 'published' or private.current_role() = 'admin');
create policy "published projects are public" on public.projects for select using (status = 'published' or private.current_role() = 'admin');
create policy "published articles or owned drafts" on public.articles for select using (status = 'published' or owner_id = (select auth.uid()) or private.current_role() = 'admin');
create policy "public event member links" on public.event_members for select using (exists(select 1 from public.events e where e.id=event_id and e.status='published'));
create policy "public article author links" on public.article_authors for select using (exists(select 1 from public.articles a where a.id=article_id and a.status='published'));
create policy "public maintainer links" on public.project_maintainers for select using (exists(select 1 from public.projects p where p.id=project_id and p.status='published'));

create policy "profiles visible to owner or admin" on public.profiles for select to authenticated using (id = (select auth.uid()) or private.current_role() = 'admin');
create policy "admins update profiles" on public.profiles for update to authenticated using (private.current_role() = 'admin') with check (private.current_role() = 'admin');
create policy "settings are readable" on public.site_settings for select using (true);
create policy "admins update settings" on public.site_settings for update to authenticated using (private.current_role() = 'admin') with check (private.current_role() = 'admin');

create policy "members create drafts" on public.articles for insert to authenticated with check (owner_id=(select auth.uid()) and status='draft' and private.current_role() in ('member','admin'));
create policy "members update owned working copy" on public.articles for update to authenticated using (owner_id=(select auth.uid()) and status in ('draft','changes_requested') and private.current_role() in ('member','admin')) with check (owner_id=(select auth.uid()) and status in ('draft','submitted') and private.current_role() in ('member','admin'));
create policy "admins manage articles" on public.articles for all to authenticated using (private.current_role()='admin') with check (private.current_role()='admin');
create policy "authors see own revisions" on public.article_revisions for select to authenticated using (author_id=(select auth.uid()) or private.current_role()='admin');
create policy "authors create revisions" on public.article_revisions for insert to authenticated with check (author_id=(select auth.uid()) and private.current_role() in ('member','admin'));
create policy "authors update working revisions" on public.article_revisions for update to authenticated using (author_id=(select auth.uid()) and status in ('draft','changes_requested')) with check (author_id=(select auth.uid()) and status in ('draft','submitted'));
create policy "admins manage revisions" on public.article_revisions for all to authenticated using (private.current_role()='admin') with check (private.current_role()='admin');

create policy "approved comments are public" on public.comments for select using (status='approved' or user_id=(select auth.uid()) or private.current_role()='admin');
create policy "users create pending comments" on public.comments for insert to authenticated with check (user_id=(select auth.uid()) and status='pending');
create policy "users edit own pending comments" on public.comments for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()) and status='pending');
create policy "admins moderate comments" on public.comments for update to authenticated using (private.current_role()='admin') with check (private.current_role()='admin');

create policy "applications visible to owner or admin" on public.applications for select to authenticated using (user_id=(select auth.uid()) or private.current_role()='admin');
create policy "applications only while open" on public.applications for insert to authenticated with check (user_id=(select auth.uid()) and exists(select 1 from public.site_settings where id=true and recruitment_open));
create policy "admins manage applications" on public.applications for update to authenticated using (private.current_role()='admin') with check (private.current_role()='admin');
create policy "anyone can contact" on public.contact_messages for insert with check (true);
create policy "admins read contacts" on public.contact_messages for select to authenticated using (private.current_role()='admin');
create policy "admins manage contacts" on public.contact_messages for update to authenticated using (private.current_role()='admin') with check (private.current_role()='admin');

create policy "admins manage members" on public.members for all to authenticated using (private.current_role()='admin') with check (private.current_role()='admin');
create policy "admins manage events" on public.events for all to authenticated using (private.current_role()='admin') with check (private.current_role()='admin');
create policy "admins manage event roster" on public.event_members for all to authenticated using (private.current_role()='admin') with check (private.current_role()='admin');
create policy "admins manage article authors" on public.article_authors for all to authenticated using (private.current_role()='admin') with check (private.current_role()='admin');
create policy "admins manage projects" on public.projects for all to authenticated using (private.current_role()='admin') with check (private.current_role()='admin');
create policy "admins manage maintainers" on public.project_maintainers for all to authenticated using (private.current_role()='admin') with check (private.current_role()='admin');
create policy "admins manage editorial queue" on public.editorial_queue for all to authenticated using (private.current_role()='admin') with check (private.current_role()='admin');

grant select on public.members, public.events, public.event_members, public.articles, public.article_authors, public.projects, public.project_maintainers, public.comments, public.site_settings to anon, authenticated;
grant select on public.profiles, public.article_revisions, public.applications, public.contact_messages, public.editorial_queue to authenticated;
grant insert, update on public.articles, public.article_revisions, public.comments, public.applications to authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant all on public.members, public.events, public.event_members, public.article_authors, public.projects, public.project_maintainers, public.editorial_queue to authenticated;
grant update on public.profiles, public.site_settings, public.contact_messages to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('public-media','public-media',true,5242880,array['image/jpeg','image/png','image/webp','image/avif']),
       ('draft-media','draft-media',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "public media readable" on storage.objects for select using (bucket_id='public-media');
create policy "members upload draft media" on storage.objects for insert to authenticated with check (bucket_id='draft-media' and (storage.foldername(name))[1]=(select auth.uid())::text and private.current_role() in ('member','admin'));
create policy "owners read draft media" on storage.objects for select to authenticated using (bucket_id='draft-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "owners replace draft media" on storage.objects for update to authenticated using (bucket_id='draft-media' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='draft-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
