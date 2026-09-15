import { redirect } from "next/navigation";
import { createArticle } from "@/app/editor-actions";
import { PageIntro } from "@/components/page-intro";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewArticlePage(){
  const supabase=await createSupabaseServerClient();const user=supabase?(await supabase.auth.getUser()).data.user:null;if(!user)redirect("/login");
  const{data:events}=await supabase!.from("events").select("id,name").eq("status","published").order("event_date",{ascending:false});
  return <><PageIntro eyebrow="New document" title="Start with the evidence." description="Markdown only. Raw HTML and executable MDX are not rendered."/><section className="content-section shell form-shell"><form action={createArticle} className="form-grid">
    <div className="field full"><label htmlFor="title">Title</label><input id="title" name="title" required maxLength={180}/></div>
    <div className="field"><label htmlFor="kind">Type</label><select id="kind" name="kind"><option value="writeup">Writeup</option><option value="blog">Blog</option></select></div>
    <div className="field"><label htmlFor="category">Category</label><input id="category" name="category" maxLength={60}/></div>
    <div className="field full"><label htmlFor="eventId">Related event (required for writeups)</label><select id="eventId" name="eventId"><option value="">No event</option>{events?.map((event)=><option key={event.id} value={event.id}>{event.name}</option>)}</select></div>
    <div className="field full"><label htmlFor="excerpt">Excerpt</label><textarea id="excerpt" name="excerpt" required minLength={20} maxLength={320}/></div>
    <div className="field full"><label htmlFor="body">Markdown</label><textarea id="body" name="body" required minLength={80} maxLength={100000}/></div>
    <div className="field full"><button className="button">Save draft</button></div>
  </form></section></>;
}
