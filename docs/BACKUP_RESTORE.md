# Supabase backup and restore

Production content lives in the Supabase project `zpxcilhmbbhowqceyafj`. Supabase managed backups are the first recovery layer. Check **Database > Backups** monthly and before any large migration.

For an independent logical backup, authenticate the Supabase CLI, link this repository to the production project, and run:

```powershell
npx supabase link --project-ref zpxcilhmbbhowqceyafj
npx supabase db dump --linked --data-only --use-copy -f backups/content.sql
npx supabase db dump --linked --role-only -f backups/roles.sql
```

Store dumps in encrypted private storage. Never commit them because applications, enquiries, account IDs, and draft content are private.

To restore after a verified incident, create a new Supabase project, apply every file in `supabase/migrations` in timestamp order, then restore the content dump with `psql`. Test authentication, public reads, draft isolation, media access, and one publish/unpublish cycle before changing the production environment variables in Vercel.

Storage objects require a separate bucket export. Copy both `public-media` and `draft-media` with an authenticated storage client, preserving object paths and metadata. Restore `draft-media` as private and `public-media` as public before re-enabling publishing.
