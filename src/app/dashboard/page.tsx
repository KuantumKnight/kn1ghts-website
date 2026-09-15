import Link from "next/link";
import { ArrowRight, Plus } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { PageIntro } from "@/components/page-intro";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <PageIntro eyebrow="Publishing desk" title="Backend connection required." description="Configure Supabase to enable the publishing workflow." />;
  const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role, member_id").eq("id", user.id).single();
  if (!profile || !["member", "admin"].includes(profile.role)) redirect("/account");
  const [postsResult, articlesResult] = await Promise.all([
    supabase.from("team_posts").select("id,title,post_type,status,updated_at,published_at").eq("owner_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("articles").select("id,title,kind,status,updated_at").eq("owner_id", user.id).order("updated_at", { ascending: false }),
  ]);
  const posts = postsResult.data ?? [], articles = articlesResult.data ?? [];
  return <><PageIntro eyebrow="Publishing desk" title="Share what the team is doing." description="Publish a win or announcement from your phone, or keep a private draft until it is ready." /><section className="content-section shell">
    <div className="dashboard-primary"><div><span className="eyebrow">Team activity</span><h2>Turn the latest result into the next team update.</h2><p>Add the story, photos, competition details, and evidence in one focused editor.</p></div><Link className="button" href="/dashboard/posts/new"><Plus /> Create post</Link></div>
    <div className="dashboard-grid"><div><span className="eyebrow">Drafts</span><h2>{posts.filter((x) => x.status === "draft" || x.status === "changes_requested").length}</h2><p>Private working copies.</p></div><div><span className="eyebrow">In review</span><h2>{posts.filter((x) => x.status === "submitted").length}</h2><p>Waiting for an administrator.</p></div><div><span className="eyebrow">Published</span><h2>{posts.filter((x) => x.status === "published").length}</h2><p>Live team updates.</p></div></div>
    <div className="dashboard-actions"><Link className="text-link" href="/dashboard/articles/new">New technical article</Link>{profile.role === "admin" ? <Link className="text-link" href="/admin">Open administration</Link> : null}</div>
    <section className="admin-queue"><div className="section-heading"><div><h2>Team posts</h2></div></div>{posts.length ? <div className="dashboard-post-list">{posts.map((item) => <Link key={item.id} href={`/dashboard/posts/${item.id}`}><span>{item.post_type.replace("_", " ")}</span><strong>{item.title}</strong><small>{item.status}</small><ArrowRight /></Link>)}</div> : <p className="admin-empty">No team posts yet.</p>}</section>
    {articles.length ? <section className="admin-queue"><div className="section-heading"><div><h2>Technical articles</h2></div></div><div className="dashboard-post-list">{articles.map((item) => <Link key={item.id} href={`/dashboard/articles/${item.id}`}><span>{item.kind}</span><strong>{item.title}</strong><small>{item.status}</small><ArrowRight /></Link>)}</div></section> : null}
  </section></>;
}
