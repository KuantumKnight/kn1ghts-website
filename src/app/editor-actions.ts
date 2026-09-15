"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const articleSchema = z.object({
  title:z.string().trim().min(4).max(180),
  kind:z.enum(["writeup","blog"]),
  category:z.string().trim().max(60),
  excerpt:z.string().trim().min(20).max(320),
  body:z.string().trim().min(80).max(100000),
  eventId:z.union([z.uuid(),z.literal("")]).optional(),
});

async function authorContext(){
  const supabase=await createSupabaseServerClient();if(!supabase)redirect("/login");
  const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
  const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).single();
  if(!profile||!["member","admin"].includes(profile.role))redirect("/account");
  return{supabase,user};
}

export async function createArticle(formData:FormData){
  const input=articleSchema.safeParse(Object.fromEntries(formData));if(!input.success)redirect("/dashboard/articles/new?error=invalid");
  const{supabase,user}=await authorContext();
  const slug=`${input.data.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")}-${crypto.randomUUID().slice(0,6)}`;
  const{eventId,...fields}=input.data;
  const{data,error}=await supabase.from("articles").insert({...fields,event_id:eventId||null,category:fields.category||null,slug,owner_id:user.id,status:"draft"}).select("id").single();
  if(error||!data)redirect("/dashboard/articles/new?error=save");redirect(`/dashboard/articles/${data.id}`);
}

export async function updateArticle(id:string,formData:FormData){
  const input=articleSchema.safeParse(Object.fromEntries(formData));if(!input.success)redirect(`/dashboard/articles/${id}?error=invalid`);
  const{supabase,user}=await authorContext();
  const{data:article}=await supabase.from("articles").select("id,status,owner_id").eq("id",id).eq("owner_id",user.id).single();if(!article)redirect("/dashboard");
  const{eventId,...fields}=input.data;
  if(article.status==="published"){
    await supabase.from("article_revisions").insert({article_id:id,author_id:user.id,...fields,status:"submitted"});
    redirect(`/dashboard/articles/${id}?saved=revision`);
  }
  await supabase.from("articles").update({...fields,event_id:eventId||null,category:fields.category||null}).eq("id",id).eq("owner_id",user.id);
  redirect(`/dashboard/articles/${id}?saved=1`);
}

export async function submitArticle(id:string){
  const{supabase,user}=await authorContext();
  const{data:item}=await supabase.from("articles").select("kind,event_id,status").eq("id",id).eq("owner_id",user.id).single();
  if(!item||!["draft","changes_requested"].includes(item.status))redirect("/dashboard");
  if(item.kind==="writeup"&&!item.event_id)redirect(`/dashboard/articles/${id}?error=event-required`);
  await supabase.from("articles").update({status:"submitted"}).eq("id",id).eq("owner_id",user.id);
  redirect("/dashboard");
}
