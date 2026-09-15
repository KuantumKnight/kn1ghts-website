"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const postType = z.enum(["ctf_result", "team_update", "announcement"]);
const uuid = z.string().uuid();
const mediaSchema = z.object({
  postId: uuid, storagePath: z.string().min(10).max(500), altText: z.string().trim().min(1).max(300),
  caption: z.string().trim().max(500).optional(), width: z.number().int().min(1).max(12000),
  height: z.number().int().min(1).max(12000), sortOrder: z.number().int().min(0).max(9), isCover: z.boolean(), revisionId: uuid.optional(),
});

type UserContext = { supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>; userId: string; role: "member" | "admin" };
async function requirePublisher(): Promise<UserContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Publishing is not configured.");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to continue.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "member" && profile?.role !== "admin") throw new Error("Publishing access has not been approved.");
  return { supabase, userId: user.id, role: profile.role };
}

function makeSlug(title: string) {
  const base = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72) || "update";
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function createPostDraft(formData: FormData) {
  const { supabase, userId } = await requirePublisher();
  const type = postType.parse(formData.get("postType"));
  const labels = { ctf_result: "Untitled CTF result", team_update: "Untitled team update", announcement: "Untitled announcement" };
  const title = labels[type];
  const { data, error } = await supabase.from("team_posts").insert({ owner_id: userId, post_type: type, title, slug: makeSlug(title), status: "draft" }).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "Could not create the draft.");
  redirect(`/dashboard/posts/${data.id}`);
}

export type PostActionState = { ok: boolean; message: string; savedAt?: string };
export async function savePostDraft(_: PostActionState, formData: FormData): Promise<PostActionState> {
  try {
    const { supabase, userId, role } = await requirePublisher();
    const postId = uuid.parse(formData.get("postId"));
    const revisionValue = String(formData.get("revisionId") ?? "");
    const revisionId = revisionValue ? uuid.parse(revisionValue) : null;
    const title = z.string().trim().min(2).max(140).parse(formData.get("title"));
    const body = z.string().trim().max(30000).parse(formData.get("body"));
    const excerptRaw = z.string().trim().max(280).parse(formData.get("excerpt") ?? "");
    const type = postType.parse(formData.get("postType"));
    const eventName = z.string().trim().max(160).parse(formData.get("eventName") ?? "");
    const eventDate = z.string().trim().max(10).parse(formData.get("eventDate") ?? "");
    const placementRaw = z.string().trim().max(8).parse(formData.get("placement") ?? "");
    const fieldSizeRaw = z.string().trim().max(8).parse(formData.get("fieldSize") ?? "");
    const sourceUrl = z.string().trim().max(1000).parse(formData.get("sourceUrl") ?? "");
    const teammateIds = formData.getAll("teammateIds").map(String).filter((value) => z.string().uuid().safeParse(value).success);
    const articleIds = formData.getAll("articleIds").map(String).filter((value) => z.string().uuid().safeParse(value).success);
    const projectIds = formData.getAll("projectIds").map(String).filter((value) => z.string().uuid().safeParse(value).success);
    const { data: existing } = await supabase.from("team_posts").select("owner_id,status,event_id").eq("id", postId).single();
    if (!existing || (existing.owner_id !== userId && role !== "admin")) throw new Error("You cannot edit this post.");
    if (existing.status === "published" && !revisionId) throw new Error("Create a revision before editing a live post.");
    if (revisionId) {
      const { data: revision } = await supabase.from("team_post_revisions").select("author_id,status").eq("id",revisionId).eq("post_id",postId).single();
      if (!revision || (revision.author_id !== userId && role !== "admin") || !["draft","changes_requested"].includes(revision.status)) throw new Error("This revision cannot be edited.");
      const { error: revisionError } = await supabase.from("team_post_revisions").update({ title, body, excerpt: excerptRaw || null, post_type: type }).eq("id",revisionId);
      if (revisionError) throw revisionError;
      return { ok: true, message: "Private revision saved", savedAt: new Date().toISOString() };
    }
    let eventId = existing.event_id as string | null;
    if (type === "ctf_result" && eventName && role === "admin") {
      const eventValues = { name: eventName, event_date: eventDate || null, placement: placementRaw ? Number(placementRaw) : null, field_size: fieldSizeRaw ? Number(fieldSizeRaw) : null, source_url: sourceUrl || null, summary: excerptRaw || body.slice(0, 280) || null, status: "draft" as const };
      const eventMutation = eventId ? supabase.from("events").update(eventValues).eq("id", eventId).select("id").single() : supabase.from("events").insert({ ...eventValues, slug: makeSlug(eventName) }).select("id").single();
      const { data: event, error: eventError } = await eventMutation;
      if (eventError) throw eventError;
      eventId = event.id;
    }
    const { error } = await supabase.from("team_posts").update({ title, body, excerpt: excerptRaw || null, post_type: type, event_id: eventId }).eq("id", postId);
    if (error) throw error;
    if (role === "admin") {
      await supabase.from("team_post_articles").delete().eq("post_id", postId);
      await supabase.from("team_post_projects").delete().eq("post_id", postId);
      if (articleIds.length) { const { error: linkError } = await supabase.from("team_post_articles").insert(articleIds.map((articleId) => ({ post_id: postId, article_id: articleId }))); if (linkError) throw linkError; }
      if (projectIds.length) { const { error: linkError } = await supabase.from("team_post_projects").insert(projectIds.map((projectId) => ({ post_id: postId, project_id: projectId }))); if (linkError) throw linkError; }
      if (eventId) {
        await supabase.from("event_members").delete().eq("event_id", eventId);
        if (teammateIds.length) { const { error: rosterError } = await supabase.from("event_members").insert(teammateIds.map((memberId) => ({ event_id: eventId, member_id: memberId }))); if (rosterError) throw rosterError; }
      }
    }
    revalidatePath("/dashboard");
    return { ok: true, message: "Draft saved", savedAt: new Date().toISOString() };
  } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Could not save the draft." }; }
}

export async function registerPostMedia(input: unknown) {
  const value = mediaSchema.parse(input);
  const { supabase, userId, role } = await requirePublisher();
  if (!value.storagePath.startsWith(`${userId}/posts/${value.postId}/`)) throw new Error("Invalid upload path.");
  const parts = value.storagePath.split("/"); const fileName = parts.pop(); const folder = parts.join("/");
  const { data: stored, error: storageError } = await supabase.storage.from("draft-media").list(folder, { search: fileName, limit: 2 });
  const object = stored?.find((item) => item.name === fileName);
  const mime = String(object?.metadata?.mimetype ?? ""), size = Number(object?.metadata?.size ?? 0);
  if (storageError || !object || !mime.startsWith("image/") || size < 1 || size > 5 * 1024 * 1024) throw new Error("The uploaded file failed server validation.");
  const { data: post } = await supabase.from("team_posts").select("owner_id,status").eq("id", value.postId).single();
  if (!post || (post.owner_id !== userId && role !== "admin") || (post.status === "published" && !value.revisionId)) throw new Error("You cannot attach media to this post.");
  if (value.revisionId) {
    const { data: revision } = await supabase.from("team_post_revisions").select("author_id,status").eq("id",value.revisionId).eq("post_id",value.postId).single();
    if (!revision || (revision.author_id !== userId && role !== "admin") || !["draft","changes_requested"].includes(revision.status)) throw new Error("You cannot attach media to this revision.");
  }
  if (value.isCover) {
    const coverQuery = supabase.from("team_post_media").update({ is_cover: false }).eq("post_id", value.postId);
    if (value.revisionId) await coverQuery.eq("revision_id", value.revisionId);
    else await coverQuery.is("revision_id", null);
  }
  const { data, error } = await supabase.from("team_post_media").insert({
    post_id: value.postId, revision_id:value.revisionId ?? null, storage_bucket: "draft-media", storage_path: value.storagePath,
    alt_text: value.altText, caption: value.caption || null, width: value.width, height: value.height,
    sort_order: value.sortOrder, is_cover: value.isCover, created_by: userId,
  }).select("id").single();
  if (error) throw error;
  return data;
}

export async function updatePostMedia(postId: string, items: Array<{ id: string; sortOrder: number; isCover: boolean; altText: string; caption: string }>, revisionId?: string) {
  const { supabase, userId, role } = await requirePublisher();
  uuid.parse(postId);
  const { data: post } = await supabase.from("team_posts").select("owner_id,status").eq("id", postId).single();
  if (!post || (post.owner_id !== userId && role !== "admin") || (post.status === "published" && !revisionId)) throw new Error("You cannot update this gallery.");
  if (items.length > 10) throw new Error("A post can contain up to 10 photos.");
  for (const item of items) {
    const parsed = z.object({ id: uuid, sortOrder: z.number().int().min(0).max(9), isCover: z.boolean(), altText: z.string().trim().min(1).max(300), caption: z.string().trim().max(500) }).parse(item);
    let query = supabase.from("team_post_media").update({ sort_order: parsed.sortOrder, is_cover: parsed.isCover, alt_text: parsed.altText, caption: parsed.caption || null }).eq("id", parsed.id).eq("post_id", postId);
    query = revisionId ? query.eq("revision_id",uuid.parse(revisionId)) : query.is("revision_id",null);
    const { error } = await query;
    if (error) throw error;
  }
}

export async function deletePostMedia(postId: string, mediaId: string, storagePath: string, revisionId?: string) {
  const { supabase, userId, role } = await requirePublisher();
  uuid.parse(postId); uuid.parse(mediaId);
  const { data: post } = await supabase.from("team_posts").select("owner_id,status").eq("id", postId).single();
  if (!post || (post.owner_id !== userId && role !== "admin") || (post.status === "published" && !revisionId)) throw new Error("You cannot remove this photo.");
  let deleteQuery = supabase.from("team_post_media").delete().eq("id", mediaId).eq("post_id", postId).eq("storage_path", storagePath);
  deleteQuery = revisionId ? deleteQuery.eq("revision_id",uuid.parse(revisionId)) : deleteQuery.is("revision_id",null);
  const { error } = await deleteQuery;
  if (error) throw error;
  await supabase.storage.from("draft-media").remove([storagePath]);
}

export async function publishPost(postId: string, revisionId?: string) {
  const { supabase, userId, role } = await requirePublisher();
  uuid.parse(postId);
  const { data: post } = await supabase.from("team_posts").select("id,slug,title,excerpt,body,post_type,status,owner_id,event_id").eq("id", postId).single();
  if (!post || (post.owner_id !== userId && role !== "admin")) throw new Error("You cannot publish this post.");
  let publishValues = { title:post.title, body:post.body, excerpt:post.excerpt as string|null, post_type:post.post_type as "ctf_result"|"team_update"|"announcement", event_id:post.event_id as string|null };
  if (revisionId) {
    const { data: revision } = await supabase.from("team_post_revisions").select("title,body,excerpt,post_type,event_id,author_id,status").eq("id",uuid.parse(revisionId)).eq("post_id",postId).single();
    if (!revision || (revision.author_id !== userId && role !== "admin")) throw new Error("You cannot publish this revision.");
    publishValues = {title:revision.title,body:revision.body,excerpt:revision.excerpt,post_type:revision.post_type,event_id:revision.event_id};
  }
  if (!publishValues.body.trim() || publishValues.title.startsWith("Untitled")) throw new Error("Add a title and description before publishing.");
  if (role !== "admin") {
    const { error } = revisionId
      ? await supabase.from("team_post_revisions").update({ status: "submitted" }).eq("id", revisionId).eq("author_id", userId)
      : await supabase.from("team_posts").update({ status: "submitted" }).eq("id", postId);
    if (error) throw error;
    revalidatePath("/dashboard"); redirect("/dashboard");
  }
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("The server publishing key is not configured.");
  let mediaQuery = admin.from("team_post_media").select("*").eq("post_id", postId);
  mediaQuery = revisionId ? mediaQuery.eq("revision_id",revisionId) : mediaQuery.is("revision_id", null);
  const { data: media } = await mediaQuery.order("sort_order");
  for (const item of media ?? []) {
    if (item.storage_bucket === "public-media") continue;
    const ext = String(item.storage_path).split(".").pop() ?? "jpg";
    const publicPath = `posts/${postId}/${item.id}.${ext}`;
    const { error: copyError } = await admin.storage.from("draft-media").copy(item.storage_path, publicPath, { destinationBucket: "public-media" });
    if (copyError) throw copyError;
    const { error: updateError } = await admin.from("team_post_media").update({ storage_bucket: "public-media", storage_path: publicPath }).eq("id", item.id);
    if (updateError) throw updateError;
  }
  if (post.event_id) await admin.from("events").update({ status: "published", published_at: new Date().toISOString() }).eq("id", post.event_id);
  const now = new Date().toISOString();
  if (revisionId && (media?.length ?? 0) > 0) {
    const { data: oldMedia } = await admin.from("team_post_media").select("id,storage_bucket,storage_path").eq("post_id",postId).is("revision_id",null);
    await admin.from("team_post_media").delete().eq("post_id",postId).is("revision_id",null);
    await admin.from("team_post_media").update({revision_id:null}).eq("revision_id",revisionId);
    await admin.from("team_post_revisions").update({status:"published"}).eq("id",revisionId);
    for (const old of oldMedia??[]) if (old.storage_bucket === "public-media") await admin.storage.from("public-media").remove([old.storage_path]);
  }
  const { error } = await admin.from("team_posts").update({ ...publishValues, status: "published", published_at: now }).eq("id", postId);
  if (error) throw error;
  revalidatePath("/"); revalidatePath("/updates"); revalidatePath(`/updates/${post.slug}`); revalidatePath("/achievements");
  redirect(`/updates/${post.slug}`);
}

export async function startPostRevision(formData: FormData) {
  const { supabase, userId, role } = await requirePublisher(); const postId = uuid.parse(formData.get("postId"));
  const { data: post } = await supabase.from("team_posts").select("id,owner_id,status,title,excerpt,body,post_type,event_id,featured").eq("id",postId).single();
  if (!post || post.status !== "published" || (post.owner_id !== userId && role !== "admin")) throw new Error("You cannot revise this post.");
  const { data: existing } = await supabase.from("team_post_revisions").select("id").eq("post_id",postId).in("status",["draft","submitted","changes_requested"]).maybeSingle();
  if (existing) redirect(`/dashboard/posts/${postId}?revision=${existing.id}`);
  const { data: revision, error } = await supabase.from("team_post_revisions").insert({post_id:postId,author_id:userId,title:post.title,excerpt:post.excerpt,body:post.body,post_type:post.post_type,event_id:post.event_id,featured:post.featured,status:"draft"}).select("id").single();
  if (error || !revision) throw new Error(error?.message ?? "Could not create the revision.");
  redirect(`/dashboard/posts/${postId}?revision=${revision.id}`);
}

export async function unpublishPost(formData: FormData) {
  const { role } = await requirePublisher();
  if (role !== "admin") throw new Error("Administrator access required.");
  const postId = uuid.parse(formData.get("postId"));
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("The server publishing key is not configured.");
  const { error } = await admin.from("team_posts").update({ status: "archived", featured: false }).eq("id", postId);
  if (error) throw error;
  revalidatePath("/"); revalidatePath("/updates"); revalidatePath("/achievements");
  redirect("/admin");
}
