import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { PageIntro } from "@/components/page-intro";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <><PageIntro eyebrow="Account" title="Backend connection required." description="Add the Supabase environment values to enable accounts." /></>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role, member_id").eq("id", user.id).single();
  return <><PageIntro eyebrow={`Account / ${profile?.role ?? "public"}`} title="Your access." description="Public accounts can comment. Publishing access is granted only after an administrator connects this account to an approved member profile." /><section className="content-section shell"><div className="account-table"><div><span>Email</span><strong>{user.email}</strong></div><div><span>Role</span><strong>{profile?.role ?? "public"}</strong></div><div><span>Member profile</span><strong>{profile?.member_id ? "Connected" : "Not connected"}</strong></div></div>{profile?.role === "member" || profile?.role === "admin" ? <a className="button" href="/dashboard">Open dashboard</a> : null}<form action={signOut}><button className="text-link" type="submit">Sign out</button></form></section></>;
}
