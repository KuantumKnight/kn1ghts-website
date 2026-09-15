import { notFound, redirect } from "next/navigation";
import { startPostRevision } from "@/app/post-actions";
import { PostComposer } from "@/components/post-composer";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EditPostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ revision?: string }> }) {
  const { id } = await params; const { revision: revisionId } = await searchParams;
  const supabase = await createSupabaseServerClient(); if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "member" && profile?.role !== "admin") redirect("/account");
  let query = supabase.from("team_posts").select("id,title,excerpt,body,post_type,status,owner_id,event_id,events(name,event_date,placement,field_size,source_url)").eq("id", id);
  if (profile.role !== "admin") query = query.eq("owner_id", user.id);
  const { data: livePost } = await query.single(); if (!livePost) notFound();
  if (livePost.status === "published" && !revisionId) return <main className="dashboard-post-page shell"><div className="dashboard-primary"><div><span className="eyebrow">Published</span><h2>{livePost.title}</h2><p>The live post stays unchanged while you prepare a private revision.</p></div><form action={startPostRevision}><input type="hidden" name="postId" value={id}/><button className="button">Create private revision</button></form></div></main>;
  let editable = livePost;
  if (revisionId) {
    const { data: revision } = await supabase.from("team_post_revisions").select("id,title,excerpt,body,post_type,status,event_id,author_id").eq("id",revisionId).eq("post_id",id).single();
    if (!revision || (revision.author_id !== user.id && profile.role !== "admin")) notFound();
    editable = { ...livePost, title:revision.title, excerpt:revision.excerpt, body:revision.body, post_type:revision.post_type, status:revision.status, event_id:revision.event_id };
  }
  let mediaQuery = supabase.from("team_post_media").select("id,storage_bucket,storage_path,alt_text,caption,width,height,sort_order,is_cover").eq("post_id", id);
  mediaQuery = revisionId ? mediaQuery.eq("revision_id",revisionId) : mediaQuery.is("revision_id", null);
  const { data: media } = await mediaQuery.order("sort_order");
  const [membersResult, articlesResult, projectsResult, teammateLinks, articleLinks, projectLinks] = await Promise.all([
    supabase.from("members").select("id,name").eq("status","published").order("name"),
    supabase.from("articles").select("id,title").eq("status","published").eq("kind","writeup").order("title"),
    supabase.from("projects").select("id,name").eq("status","published").order("name"),
    livePost.event_id ? supabase.from("event_members").select("member_id").eq("event_id",livePost.event_id) : Promise.resolve({data:[]}),
    supabase.from("team_post_articles").select("article_id").eq("post_id",id),
    supabase.from("team_post_projects").select("project_id").eq("post_id",id),
  ]);
  const initialMedia = await Promise.all((media ?? []).map(async (item) => {
    const previewUrl = item.storage_bucket === "public-media" ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${item.storage_path}` : (await supabase.storage.from("draft-media").createSignedUrl(item.storage_path, 3600)).data?.signedUrl ?? "";
    return { id: item.id, storagePath: item.storage_path, previewUrl, altText: item.alt_text, caption: item.caption ?? "", width: item.width, height: item.height, isCover: item.is_cover };
  }));
  const event = Array.isArray(livePost.events) ? livePost.events[0] : livePost.events;
  return <main className="dashboard-post-page shell"><PostComposer post={{ id, title: editable.title, excerpt: editable.excerpt ?? "", body: editable.body, postType: editable.post_type, status: editable.status, revisionId, eventName:event?.name, eventDate:event?.event_date ?? "", placement:event?.placement, fieldSize:event?.field_size, sourceUrl:event?.source_url ?? "" }} initialMedia={initialMedia} role={profile.role} members={(membersResult.data??[]).map((item)=>({id:item.id,label:item.name}))} articles={(articlesResult.data??[]).map((item)=>({id:item.id,label:item.title}))} projects={(projectsResult.data??[]).map((item)=>({id:item.id,label:item.name}))} selected={{teammates:(teammateLinks.data??[]).map((item)=>item.member_id),articles:(articleLinks.data??[]).map((item)=>item.article_id),projects:(projectLinks.data??[]).map((item)=>item.project_id)}} /></main>;
}
