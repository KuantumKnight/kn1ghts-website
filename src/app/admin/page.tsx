import { redirect } from "next/navigation";
import Link from "next/link";
import { approveAccount,resolveContact,setApplicationReview,setArticleReview,setCommentReview,setRevisionReview,toggleRecruitment } from "@/app/admin-actions";
import { PageIntro } from "@/components/page-intro";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type QueueItem={id:string;title?:string;body?:string;display_name?:string|null;subject?:string;area?:string;name?:string};
function ReviewRows({title,items,action,approve="Approve",reject="Request changes"}:{title:string;items:QueueItem[];action:(data:FormData)=>Promise<void>;approve?:string;reject?:string}){return <section className="admin-queue"><div className="section-heading"><div><h2>{title}</h2></div></div>{items.length?items.map((item)=><div className="admin-row" key={item.id}><div><strong>{item.title??item.display_name??item.name??item.subject??item.area??"Queued item"}</strong>{item.body?<p>{item.body}</p>:null}</div><form action={action}><input type="hidden" name="id" value={item.id}/><button name="decision" value={approve==="Publish"?"publish":approve==="Accept"?"accept":"approve"}>{approve}</button><button name="decision" value={reject==="Reject"?"reject":"changes"}>{reject}</button></form></div>):<p className="admin-empty">Queue clear.</p>}</section>}

export default async function AdminPage(){
  const supabase=await createSupabaseServerClient();if(!supabase)return <PageIntro eyebrow="Administration" title="Backend connection required." description="Configure Supabase to enable protected administration."/>;
  const{data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");const{data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).single();if(profile?.role!=="admin")redirect("/account");
  const[profiles,articles,revisions,comments,applications,contacts,members,settings,teamPosts,postRevisions]=await Promise.all([
    supabase.from("profiles").select("id,display_name,role,member_id").eq("role","public").order("created_at",{ascending:false}).limit(20),
    supabase.from("articles").select("id,title").eq("status","submitted").limit(20),
    supabase.from("article_revisions").select("id,title").eq("status","submitted").limit(20),
    supabase.from("comments").select("id,body").eq("status","pending").limit(20),
    supabase.from("applications").select("id,area").in("status",["received","reviewing"]).limit(20),
    supabase.from("contact_messages").select("id,name,subject").in("status",["unread","read"]).limit(20),
    supabase.from("members").select("id,name").eq("status","draft").order("name"),
    supabase.from("site_settings").select("recruitment_open").eq("id",true).single(),
    supabase.from("team_posts").select("id,title,post_type,status,updated_at").order("updated_at",{ascending:false}).limit(50),
    supabase.from("team_post_revisions").select("id,post_id,title,status,updated_at").eq("status","submitted").order("updated_at",{ascending:false}).limit(50),
  ]);
  return <><PageIntro eyebrow="Administration" title="The review queue." description="Publishing, moderation, membership, applications, and incoming enquiries in one protected workspace."/><section className="content-section shell">
    <div className="dashboard-primary"><div><span className="eyebrow">Publishing</span><h2>Share the latest win.</h2><p>Create a result, team update, or announcement and publish it directly.</p></div><Link className="button" href="/dashboard/posts/new">Create post</Link></div>
    <div className="admin-setting"><div><span className="eyebrow">Recruitment</span><strong>{settings.data?.recruitment_open?"Open":"Closed"}</strong></div><form action={toggleRecruitment}><button className="button" name="open" value={settings.data?.recruitment_open?"false":"true"}>{settings.data?.recruitment_open?"Close applications":"Open applications"}</button></form></div>
    <section className="admin-queue"><div className="section-heading"><div><h2>Account approval</h2></div></div>{profiles.data?.length?profiles.data.map((item)=><div className="admin-row" key={item.id}><strong>{item.display_name??"Unnamed account"}</strong><form action={approveAccount}><input type="hidden" name="profileId" value={item.id}/><select name="memberId" required><option value="">Connect member profile</option>{members.data?.map((member)=><option key={member.id} value={member.id}>{member.name}</option>)}</select><button>Approve member</button></form></div>):<p className="admin-empty">No public accounts awaiting review.</p>}</section>
    <ReviewRows title="Articles" items={(articles.data??[]) as QueueItem[]} action={setArticleReview} approve="Publish"/>
    <section className="admin-queue"><div className="section-heading"><div><h2>Team posts</h2></div></div>{teamPosts.data?.length?<div className="dashboard-post-list">{teamPosts.data.map((item)=><Link href={`/dashboard/posts/${item.id}`} key={item.id}><span>{item.post_type.replace("_"," ")}</span><strong>{item.title}</strong><small>{item.status}</small></Link>)}</div>:<p className="admin-empty">No team posts yet.</p>}</section>
    {postRevisions.data?.length?<section className="admin-queue"><div className="section-heading"><div><h2>Post revisions</h2></div></div><div className="dashboard-post-list">{postRevisions.data.map((item)=><Link href={`/dashboard/posts/${item.post_id}?revision=${item.id}`} key={item.id}><span>Revision</span><strong>{item.title}</strong><small>{item.status}</small></Link>)}</div></section>:null}
    <ReviewRows title="Published revisions" items={(revisions.data??[]) as QueueItem[]} action={setRevisionReview} approve="Publish"/>
    <ReviewRows title="Comment moderation" items={(comments.data??[]) as QueueItem[]} action={setCommentReview} reject="Reject"/>
    <ReviewRows title="Applications" items={(applications.data??[]) as QueueItem[]} action={setApplicationReview} approve="Accept" reject="Reject"/>
    <ReviewRows title="Contact inbox" items={(contacts.data??[]) as QueueItem[]} action={resolveContact} approve="Resolve" reject="Resolve"/>
  </section></>;
}
