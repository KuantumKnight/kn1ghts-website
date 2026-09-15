import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { UpdateCard } from "@/components/update-card";
import { getTeamPosts } from "@/lib/content";

export const metadata: Metadata = { title: "Updates", description: "Competition results, team updates, and announcements from KN1GHTS." };
export default async function UpdatesPage() {
  const posts = await getTeamPosts();
  return <><PageIntro eyebrow="Team activity" title="From the arena." description="Competition results, team progress, and announcements from KN1GHTS." /><section className="content-section shell">{posts.length ? <div className="updates-grid">{posts.map((post, index) => <UpdateCard key={post.id} post={post} featured={index === 0} />)}</div> : <div className="empty-state"><h2>No updates yet.</h2><p>The first published team post will appear here.</p></div>}</section></>;
}
