import { notFound, redirect } from "next/navigation";
import { ArticleBody } from "@/components/article-body";
import { Gallery } from "@/components/gallery";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PostPreview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{revision?:string}> }) {
  const { id } = await params; const {revision:revisionId}=await searchParams; const supabase = await createSupabaseServerClient(); if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const { data: post } = await supabase.from("team_posts").select("id,title,excerpt,body,post_type,status,owner_id").eq("id", id).single();
  if (!post || (post.owner_id !== user.id && profile?.role !== "admin")) notFound();
  let previewPost=post;
  if(revisionId){const{data:revision}=await supabase.from("team_post_revisions").select("title,excerpt,body,post_type,author_id").eq("id",revisionId).eq("post_id",id).single();if(!revision||(revision.author_id!==user.id&&profile?.role!=="admin"))notFound();previewPost={...post,...revision};}
  let mediaQuery=supabase.from("team_post_media").select("id,storage_bucket,storage_path,alt_text,caption,width,height,sort_order,is_cover").eq("post_id", id);mediaQuery=revisionId?mediaQuery.eq("revision_id",revisionId):mediaQuery.is("revision_id",null);const { data: media }=await mediaQuery.order("sort_order");
  const gallery = await Promise.all((media ?? []).map(async (item) => ({ id: item.id, url: item.storage_bucket === "public-media" ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${item.storage_path}` : (await supabase.storage.from("draft-media").createSignedUrl(item.storage_path, 900)).data?.signedUrl ?? "", altText: item.alt_text, caption: item.caption, width: item.width, height: item.height, sortOrder: item.sort_order, isCover: item.is_cover })));
  return <article className="update-detail shell"><header><span className="eyebrow">Private preview · {previewPost.post_type.replace("_", " ")}</span><h1>{previewPost.title}</h1><p>{previewPost.excerpt}</p></header>{gallery.length ? <Gallery images={gallery} /> : null}<div className="article-layout"><aside className="article-aside">Story</aside><ArticleBody source={previewPost.body} /></div></article>;
}
