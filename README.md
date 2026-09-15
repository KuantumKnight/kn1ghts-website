# KN1GHTS

The public website and reviewed publishing platform for KN1GHTS.

## Local development

1. Copy `.env.example` to `.env.local` and add Supabase credentials when available.
2. Install dependencies with `npm install`.
3. Run `npm run dev`.

The public site works without Supabase credentials using the two verified LinkedIn-sourced results. Apply every migration in `supabase/migrations` in timestamp order before enabling accounts and publishing.

## Production setup

1. Create separate Supabase projects for preview and production.
2. Apply every file in `supabase/migrations` in timestamp order to each project.
3. Enable email magic links in Supabase Auth and add the matching `/auth/callback` URLs. To enable GitHub login, configure a GitHub OAuth app and set `NEXT_PUBLIC_GITHUB_AUTH_ENABLED=true`.
4. Add the values from `.env.example` to Vercel. Keep `SUPABASE_SECRET_KEY`, `GITHUB_TOKEN`, and `CRON_SECRET` server-only.
5. Sign in once, then bootstrap the first administrator from the Supabase SQL editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'YOUR_EMAIL');
   ```

6. Use `/dashboard` to create CTF results, team updates, announcements, and technical articles. Use `/admin` to publish submitted work, connect accounts to member profiles, and moderate comments.

Preview deployments must point at the preview Supabase project. Configure daily database backups and Vercel error monitoring before launch.

## Content policy

Never add placements, members, projects, statistics, or writeups without a verifiable source. The current public dataset includes the ExploitX and BLACKBOX 2026 wins sourced from the KN1GHTS LinkedIn company page; unknown dates and participant rosters remain omitted.
