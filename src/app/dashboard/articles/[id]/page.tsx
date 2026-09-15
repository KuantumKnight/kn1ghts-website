import { notFound,redirect } from "next/navigation";
import { ArticleBody } from "@/components/article-body";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { submitArticle,updateArticle } from "@/app/editor-actions";

export default async function EditArticlePage({params}:{params:Promise<{id:string}>}){
  const{id}=await params;const supabase=await createSupabaseServerClient();if(!supabase)redirect("/login");
  const{data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
  const{data:item}=await supabase.from("articles").select("id,title,excerpt,body,status,kind,category,event_id").eq("id",id).eq("owner_id",user.id).single();if(!item)notFound();
  const{data:events}=await supabase.from("events").select("id,name").eq("status","published").order("event_date",{ascending:false});
  const save=updateArticle.bind(null,id);const submit=submitArticle.bind(null,id);
  return <section className="detail shell"><header className="detail-header"><span className="eyebrow">{item.status}</span><div><h1>{item.title}</h1><p>{item.excerpt}</p></div></header>
    <div className="editor-layout"><form action={save} className="form-grid">
      <div className="field full"><label htmlFor="title">Title</label><input id="title" name="title" defaultValue={item.title} required/></div><input type="hidden" name="kind" value={item.kind}/>
      <div className="field"><label htmlFor="category">Category</label><input id="category" name="category" defaultValue={item.category??""}/></div>
      <div className="field"><label htmlFor="eventId">Event</label><select id="eventId" name="eventId" defaultValue={item.event_id??""}><option value="">No event</option>{events?.map((event)=><option key={event.id} value={event.id}>{event.name}</option>)}</select></div>
      <div className="field full"><label htmlFor="excerpt">Excerpt</label><textarea id="excerpt" name="excerpt" defaultValue={item.excerpt??""} required/></div>
      <div className="field full"><label htmlFor="body">Markdown</label><textarea id="body" name="body" defaultValue={item.body} required/></div>
      <button className="button">{item.status==="published"?"Submit revision":"Save draft"}</button>
    </form>{["draft","changes_requested"].includes(item.status)?<form action={submit}><button className="text-link">Submit for review</button></form>:null}</div>
    <div className="article-layout"><aside className="article-aside">Preview / Markdown</aside><ArticleBody source={item.body}/></div>
  </section>;
}
