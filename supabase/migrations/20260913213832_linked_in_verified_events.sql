-- Public result claims transcribed from the KN1GHTS LinkedIn company page.
-- Dates, participant rosters, and field sizes remain null until separately
-- sourced and approved.
insert into public.events (
  slug, name, summary, placement, source_url, featured, status
)
values
(
  'exploitx-into-the-void-2',
  'ExploitX — Into The Void 2.0',
  '1st among 120+ teams in the qualification round, then 1st among 40 teams in the finals. The public announcement says the final margin was 28 points over 2nd place.',
  1,
  'https://www.linkedin.com/company/kn1ghts/',
  true,
  'published'
),
(
  'blackbox-2026',
  'BLACKBOX 2026',
  '1st Place at a story-driven cybersecurity and web engineering challenge organized by the CodeChef VIT Chennai Chapter at VIT Chennai.',
  1,
  'https://www.linkedin.com/company/kn1ghts/',
  true,
  'published'
)
on conflict (slug) do nothing;
