import { redirect } from "next/navigation";
import { createPostDraft } from "@/app/post-actions";
import { PageIntro } from "@/components/page-intro";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewPostPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <PageIntro eyebrow="Publishing desk" title="Backend connection required." description="Configure Supabase before creating team posts." />;
  const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "member" && profile?.role !== "admin") redirect("/account");
  return <><PageIntro eyebrow="Create post" title="What happened?" description="Choose the kind of update. You can add the story, details, and photos on the next screen." /><section className="content-section shell"><form action={createPostDraft} className="post-type-grid"><button name="postType" value="ctf_result"><span>01</span><strong>CTF result</strong><p>Record a placement, competition details, teammates, evidence, and photos.</p></button><button name="postType" value="team_update"><span>02</span><strong>Team update</strong><p>Share progress, field notes, travel, workshops, and life inside KN1GHTS.</p></button><button name="postType" value="announcement"><span>03</span><strong>Announcement</strong><p>Publish a clear team notice, release, partnership, or upcoming event.</p></button></form></section></>;
}
