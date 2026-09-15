import "server-only";
import { cache } from "react";
import type { Article, EventRecord, Member, ProjectRecord, TeamPost } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { linkedInEvents } from "@/lib/verified-data";

type Row = Record<string, unknown>;
const rows = (value: unknown): Row[] => Array.isArray(value) ? value as Row[] : [];
const relatedRows = (value: unknown): Row[] => Array.isArray(value) ? value as Row[] : value && typeof value === "object" ? [value as Row] : [];
const stringArray = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const nullableString = (value: unknown) => typeof value === "string" ? value : null;

function memberFrom(row: Row): Member {
  return { id:String(row.id), slug:String(row.slug), name:String(row.name), handle:String(row.handle), bio:nullableString(row.bio), specialties:stringArray(row.specialties), avatarUrl:nullableString(row.avatar_url), githubUrl:nullableString(row.github_url), linkedinUrl:nullableString(row.linkedin_url) };
}
function eventFrom(row: Row): EventRecord {
  return { id:String(row.id), slug:String(row.slug), name:String(row.name), summary:nullableString(row.summary), eventDate:nullableString(row.event_date), placement:typeof row.placement === "number" ? row.placement : null, fieldSize:typeof row.field_size === "number" ? row.field_size : null, sourceUrl:nullableString(row.source_url), featured:Boolean(row.featured) };
}

export const getEvents = cache(async (): Promise<EventRecord[]> => {
  const supabase=await createSupabaseServerClient(); if(!supabase) return linkedInEvents;
  const {data,error}=await supabase.from("events").select("id,slug,name,summary,event_date,placement,field_size,source_url,featured").eq("status","published").order("event_date",{ascending:false});
  if(error){console.error("Unable to load events:",error.message);return [];} return rows(data).map(eventFrom);
});
export const getMembers = cache(async (): Promise<Member[]> => {
  const supabase=await createSupabaseServerClient(); if(!supabase) return [];
  const {data,error}=await supabase.from("members").select("id,slug,name,handle,bio,specialties,avatar_url,github_url,linkedin_url").eq("status","published").order("display_order");
  if(error){console.error("Unable to load members:",error.message);return [];} return rows(data).map(memberFrom);
});
export const getProjects = cache(async (): Promise<ProjectRecord[]> => {
  const supabase=await createSupabaseServerClient(); if(!supabase) return [];
  const {data,error}=await supabase.from("projects").select("id,slug,name,description,repository_url,technologies,stars,stars_updated_at,project_maintainers(members(slug,name,handle))").eq("status","published").order("published_at",{ascending:false});
  if(error){console.error("Unable to load projects:",error.message);return [];} return rows(data).map((row)=>({id:String(row.id),slug:String(row.slug),name:String(row.name),description:String(row.description),repositoryUrl:String(row.repository_url),technologies:stringArray(row.technologies),stars:typeof row.stars === "number"?row.stars:null,starsUpdatedAt:nullableString(row.stars_updated_at),maintainers:relatedRows(row.project_maintainers).flatMap((link)=>relatedRows(link.members).map((member)=>({slug:String(member.slug),name:String(member.name),handle:String(member.handle)})))}));
});
export const getArticles = cache(async (kind:"writeup"|"blog"): Promise<Article[]> => {
  const supabase=await createSupabaseServerClient(); if(!supabase) return [];
  const {data,error}=await supabase.from("articles").select("id,slug,title,excerpt,body,kind,category,published_at,events(slug,name),article_authors(members(slug,name,handle))").eq("status","published").eq("kind",kind).order("published_at",{ascending:false});
  if(error){console.error("Unable to load articles:",error.message);return [];} return rows(data).map((row)=>{const event=relatedRows(row.events)[0];return {id:String(row.id),slug:String(row.slug),title:String(row.title),excerpt:nullableString(row.excerpt),body:String(row.body),kind:row.kind === "writeup"?"writeup":"blog",category:nullableString(row.category),publishedAt:nullableString(row.published_at),event:event?{slug:String(event.slug),name:String(event.name)}:null,authors:relatedRows(row.article_authors).flatMap((link)=>relatedRows(link.members).map((member)=>({slug:String(member.slug),name:String(member.name),handle:String(member.handle)})))};});
});
export const getEvent=cache(async(slug:string)=>(await getEvents()).find((item)=>item.slug===slug));
export const getMember=cache(async(slug:string)=>(await getMembers()).find((item)=>item.slug===slug));
export const getProject=cache(async(slug:string)=>(await getProjects()).find((item)=>item.slug===slug));
export const getArticle=cache(async(kind:"writeup"|"blog",slug:string)=>(await getArticles(kind)).find((item)=>item.slug===slug));
export const getComments=cache(async(articleId:string)=>{const supabase=await createSupabaseServerClient();if(!supabase)return [];const {data}=await supabase.from("comments").select("id,body,created_at,profiles(display_name)").eq("article_id",articleId).eq("status","approved").order("created_at");return rows(data).map((row)=>{const profile=relatedRows(row.profiles)[0];return{id:String(row.id),body:String(row.body),createdAt:String(row.created_at),author:profile?String(profile.display_name??"Reader"):"Reader"};});});

const fallbackPosts: TeamPost[] = linkedInEvents.map((event, index) => ({
  id: `linkedin-${event.id}`,
  slug: event.slug,
  postType: "ctf_result",
  title: index === 0 ? "KN1GHTS wins ExploitX: Into The Void 2.0" : "KN1GHTS takes first place at BLACKBOX 2026",
  excerpt: event.summary,
  body: event.summary ?? "",
  featured: index === 0,
  publishedAt: null,
  event,
  media: [],
}));

function postFrom(row: Row): TeamPost {
  const eventRow = relatedRows(row.events)[0];
  const event = eventRow ? eventFrom(eventRow) : null;
  const media = relatedRows(row.team_post_media).map((item) => ({
    id: String(item.id),
    url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${String(item.storage_bucket)}/${String(item.storage_path)}`,
    altText: String(item.alt_text),
    caption: nullableString(item.caption),
    width: Number(item.width),
    height: Number(item.height),
    sortOrder: Number(item.sort_order),
    isCover: Boolean(item.is_cover),
  })).sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    id: String(row.id), slug: String(row.slug),
    postType: row.post_type === "ctf_result" || row.post_type === "announcement" ? row.post_type : "team_update",
    title: String(row.title), excerpt: nullableString(row.excerpt), body: String(row.body),
    featured: Boolean(row.featured), publishedAt: nullableString(row.published_at), event, media,
  };
}

export const getTeamPosts = cache(async (): Promise<TeamPost[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fallbackPosts;
  const { data, error } = await supabase.from("team_posts")
    .select("id,slug,post_type,title,excerpt,body,featured,published_at,events(id,slug,name,summary,event_date,placement,field_size,source_url,featured),team_post_media(id,storage_bucket,storage_path,alt_text,caption,width,height,sort_order,is_cover,revision_id)")
    .eq("status", "published").is("team_post_media.revision_id", null).order("published_at", { ascending: false });
  if (error) { console.error("Unable to load team posts:", error.message); return fallbackPosts; }
  const posts = rows(data).map(postFrom);
  return posts.length ? posts : fallbackPosts;
});

export const getTeamPost = cache(async (slug: string) => (await getTeamPosts()).find((item) => item.slug === slug));
