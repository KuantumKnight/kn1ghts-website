"use client";

import { ArrowDown, ArrowUp, Image as ImageIcon, LinkSimple, Star, Trash } from "@phosphor-icons/react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { deletePostMedia, publishPost, registerPostMedia, savePostDraft, updatePostMedia, type PostActionState } from "@/app/post-actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { TeamPostType } from "@/lib/types";

type DraftMedia = { id: string; storagePath: string; previewUrl: string; altText: string; caption: string; width: number; height: number; isCover: boolean };
type Option = { id: string; label: string };
type Props = { post: { id: string; title: string; excerpt: string; body: string; postType: TeamPostType; status: string; revisionId?: string; eventName?: string; eventDate?: string; placement?: number | null; fieldSize?: number | null; sourceUrl?: string }; initialMedia: DraftMedia[]; role: "member" | "admin"; members: Option[]; articles: Option[]; projects: Option[]; selected: { teammates: string[]; articles: string[]; projects: string[] } };
const initialState: PostActionState = { ok: false, message: "" };

function insertAround(textarea: HTMLTextAreaElement, before: string, after = before) {
  const start = textarea.selectionStart, end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || "text";
  textarea.setRangeText(`${before}${selected}${after}`, start, end, "select");
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.focus();
}

export function PostComposer({ post, initialMedia, role, members, articles, projects, selected }: Props) {
  const [state, action, pending] = useActionState(savePostDraft, initialState);
  const [media, setMedia] = useState(initialMedia);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [notice, setNotice] = useState("");
  const [isMutating, startTransition] = useTransition();
  const [postType, setPostType] = useState(post.postType);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`kn1ghts-post-${post.id}`);
    if (!saved || !formRef.current) return;
    try {
      const values = JSON.parse(saved) as Record<string, string>;
      for (const [name, value] of Object.entries(values)) {
        const field = formRef.current.elements.namedItem(name);
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) field.value = value;
      }
    } catch { localStorage.removeItem(`kn1ghts-post-${post.id}`); }
  }, [post.id]);

  function preserveLocally() {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    localStorage.setItem(`kn1ghts-post-${post.id}`, JSON.stringify(Object.fromEntries([...data].filter(([, value]) => typeof value === "string"))));
    setNotice("Saved on this device");
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const selected = [...files].slice(0, 10 - media.length);
    if (!selected.length) { setNotice("A post can contain up to 10 photos."); return; }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setNotice("Photo uploads need the Supabase publishable key."); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNotice("Sign in again before uploading."); return; }
    setUploading({ done: 0, total: selected.length });
    for (let index = 0; index < selected.length; index++) {
      const file = selected[index];
      try {
        if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) throw new Error(`${file.name} must be an image under 5 MB.`);
        const bitmap = await createImageBitmap(file);
        const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const storagePath = `${user.id}/posts/${post.id}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("draft-media").upload(storagePath, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        const altText = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
        const record = await registerPostMedia({ postId: post.id, revisionId: post.revisionId, storagePath, altText, caption: "", width: bitmap.width, height: bitmap.height, sortOrder: media.length + index, isCover: media.length + index === 0 });
        const { data: signed } = await supabase.storage.from("draft-media").createSignedUrl(storagePath, 3600);
        setMedia((current) => [...current, { id: record.id, storagePath, previewUrl: signed?.signedUrl ?? URL.createObjectURL(file), altText, caption: "", width: bitmap.width, height: bitmap.height, isCover: current.length === 0 }]);
        bitmap.close();
      } catch (error) { setNotice(error instanceof Error ? error.message : "Upload failed. Try again."); }
      setUploading({ done: index + 1, total: selected.length });
    }
    setUploading(null);
  }

  function persistGallery(next: DraftMedia[]) {
    setMedia(next);
    startTransition(async () => {
      try { await updatePostMedia(post.id, next.map((item, sortOrder) => ({ id: item.id, sortOrder, isCover: item.isCover, altText: item.altText, caption: item.caption })), post.revisionId); setNotice("Gallery saved"); }
      catch (error) { setNotice(error instanceof Error ? error.message : "Could not save the gallery."); }
    });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= media.length) return;
    const next = [...media]; [next[index], next[target]] = [next[target], next[index]]; persistGallery(next);
  }

  return <div className="composer-shell">
    <form ref={formRef} action={action} className="composer-form" onInput={preserveLocally}>
      <input type="hidden" name="postId" value={post.id} />
      {post.revisionId ? <input type="hidden" name="revisionId" value={post.revisionId} /> : null}
      <header className="composer-topbar"><div><span className="eyebrow">{post.revisionId ? "private revision" : post.status}</span><p>{state.message || notice || "Changes are kept privately until publication."}</p></div><div className="composer-actions"><button className="text-link" type="submit" disabled={pending}>{pending ? "Saving…" : "Save draft"}</button><a className="text-link" href={`/dashboard/posts/${post.id}/preview${post.revisionId ? `?revision=${post.revisionId}` : ""}`} target="_blank">Preview</a><button className="button button-compact" type="button" disabled={pending || isMutating} onClick={() => startTransition(() => publishPost(post.id, post.revisionId))}>{role === "admin" ? (post.revisionId ? "Publish changes" : "Publish") : "Submit for review"}</button></div></header>
      <div className="field"><label htmlFor="postType">Post type</label><select id="postType" name="postType" value={postType} onChange={(event) => setPostType(event.target.value as TeamPostType)}><option value="ctf_result">CTF result</option><option value="team_update">Team update</option><option value="announcement">Announcement</option></select></div>
      <div className="field"><label htmlFor="title">Title</label><input id="title" name="title" defaultValue={post.title.startsWith("Untitled") ? "" : post.title} required maxLength={140} placeholder="What happened?" /></div>
      <div className="field"><label htmlFor="excerpt">Short summary</label><textarea id="excerpt" name="excerpt" defaultValue={post.excerpt} maxLength={280} placeholder="A one or two sentence preview for the feed." /></div>
      <div className="field"><label htmlFor="body">Description</label><div className="format-toolbar" aria-label="Text formatting"><button type="button" onClick={() => bodyRef.current && insertAround(bodyRef.current, "**")}>Bold</button><button type="button" onClick={() => bodyRef.current && insertAround(bodyRef.current, "*")}>Italic</button><button type="button" onClick={() => bodyRef.current && insertAround(bodyRef.current, "## ", "")}>Heading</button><button type="button" onClick={() => bodyRef.current && insertAround(bodyRef.current, "[", "](https://)")}><LinkSimple /> Link</button><button type="button" onClick={() => bodyRef.current && insertAround(bodyRef.current, "- ", "")}>List</button></div><textarea ref={bodyRef} id="body" name="body" defaultValue={post.body} required maxLength={30000} placeholder="Tell the story of the result or update." /></div>
      {postType === "ctf_result" ? <fieldset className="event-fields"><legend>Competition details</legend><div className="form-grid"><div className="field full"><label htmlFor="eventName">Event name</label><input id="eventName" name="eventName" defaultValue={post.eventName} maxLength={160} /></div><div className="field"><label htmlFor="eventDate">Event date (optional)</label><input id="eventDate" name="eventDate" type="date" defaultValue={post.eventDate} /></div><div className="field"><label htmlFor="placement">Placement</label><input id="placement" name="placement" type="number" min="1" defaultValue={post.placement ?? ""} /></div><div className="field"><label htmlFor="fieldSize">Participant count</label><input id="fieldSize" name="fieldSize" type="number" min="1" defaultValue={post.fieldSize ?? ""} /></div><div className="field full"><label htmlFor="sourceUrl">Evidence link</label><input id="sourceUrl" name="sourceUrl" type="url" defaultValue={post.sourceUrl} placeholder="https://" /></div>{members.length ? <div className="field full"><label htmlFor="teammateIds">Teammates</label><select id="teammateIds" name="teammateIds" multiple defaultValue={selected.teammates}>{members.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><span className="field-help">Use Ctrl or Command to choose several teammates.</span></div> : null}</div>{role !== "admin" ? <p className="field-help">An administrator will verify and connect the event before publication.</p> : null}</fieldset> : null}
      {(articles.length || projects.length) ? <fieldset className="event-fields"><legend>Related work</legend><div className="form-grid">{articles.length ? <div className="field"><label htmlFor="articleIds">Writeups</label><select id="articleIds" name="articleIds" multiple defaultValue={selected.articles}>{articles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div> : null}{projects.length ? <div className="field"><label htmlFor="projectIds">Projects</label><select id="projectIds" name="projectIds" multiple defaultValue={selected.projects}>{projects.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div> : null}</div></fieldset> : null}
    </form>
    <section className="media-desk"><div className="media-heading"><div><span className="eyebrow"><ImageIcon /> Photos</span><h2>Build the gallery</h2><p>Up to 10 images, 5 MB each. Add useful image descriptions.</p></div><label className="button button-compact">Add photos<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(event) => upload(event.target.files)} /></label></div>
      {uploading ? <div className="upload-progress"><span style={{ width: `${(uploading.done / uploading.total) * 100}%` }} /><p>Uploading {uploading.done} of {uploading.total}</p></div> : null}
      {media.length ? <div className="media-editor">{media.map((item, index) => <article key={item.id}><Image src={item.previewUrl} alt="" width={item.width} height={item.height} unoptimized /><div className="media-controls"><div className="media-order"><button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move photo earlier"><ArrowUp /></button><button type="button" onClick={() => move(index, 1)} disabled={index === media.length - 1} aria-label="Move photo later"><ArrowDown /></button><button type="button" className={item.isCover ? "is-cover" : ""} onClick={() => persistGallery(media.map((entry) => ({ ...entry, isCover: entry.id === item.id })))}><Star weight={item.isCover ? "fill" : "regular"} /> {item.isCover ? "Cover" : "Set cover"}</button><button type="button" onClick={() => startTransition(async () => { await deletePostMedia(post.id, item.id, item.storagePath); persistGallery(media.filter((entry) => entry.id !== item.id).map((entry, i) => ({ ...entry, isCover: i === 0 ? true : entry.isCover }))); })} aria-label="Remove photo"><Trash /></button></div><label>Image description<input value={item.altText} maxLength={300} onChange={(event) => setMedia((current) => current.map((entry) => entry.id === item.id ? { ...entry, altText: event.target.value } : entry))} onBlur={() => persistGallery(media)} /></label><label>Caption (optional)<input value={item.caption} maxLength={500} onChange={(event) => setMedia((current) => current.map((entry) => entry.id === item.id ? { ...entry, caption: event.target.value } : entry))} onBlur={() => persistGallery(media)} /></label></div></article>)}</div> : <div className="media-empty"><ImageIcon /><p>Add the photos that make this update feel real.</p></div>}
    </section>
  </div>;
}
