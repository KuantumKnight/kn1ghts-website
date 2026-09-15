"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { FormState } from "@/lib/form-state";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(160),
  subject: z.enum(["general", "ctf", "research", "recruitment"]),
  message: z.string().trim().min(20).max(4000),
  company: z.string().max(0),
});

export async function submitContact(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Check the required fields and keep the message between 20 and 4,000 characters." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Contact storage is awaiting production configuration. Please use LinkedIn for now." };
  const { company: _honeypot, ...payload } = parsed.data;
  void _honeypot;
  const { error } = await supabase.from("contact_messages").insert(payload);
  if (error) return { status: "error", message: "The message could not be sent. Please try again later." };
  return { status: "success", message: "Message received. The team will respond through the email you provided." };
}

const applicationSchema = z.object({
  area: z.enum(["web", "pwn", "crypto", "forensics", "osint", "operations"]),
  experience: z.string().trim().min(40).max(5000),
  links: z.string().trim().max(1000),
});

export async function submitApplication(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = applicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Tell us a little more about your experience before submitting." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Applications are currently closed." };
  const { data: settings } = await supabase.from("site_settings").select("recruitment_open").single();
  if (!settings?.recruitment_open) return { status: "error", message: "Applications are currently closed." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Sign in before submitting an application." };
  const { error } = await supabase.from("applications").insert({ ...parsed.data, user_id: user.id });
  return error ? { status: "error", message: "The application could not be submitted." } : { status: "success", message: "Application received. You can track it from your account." };
}

export async function signInWithEmail(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { status: "error", message: "Authentication is awaiting Supabase configuration." };
  const email = z.email().safeParse(formData.get("email"));
  if (!email.success) return { status: "error", message: "Enter a valid email address." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Authentication is unavailable." };
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  const { error } = await supabase.auth.signInWithOtp({ email: email.data, options: { emailRedirectTo: `${origin}/auth/callback` } });
  return error ? { status: "error", message: error.message } : { status: "success", message: "Check your inbox for a secure sign-in link." };
}

export async function signInWithGitHub() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login?error=not-configured");
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: `${origin}/auth/callback` } });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}

const commentSchema=z.object({articleId:z.uuid(),body:z.string().trim().min(2).max(2000)});
export async function submitComment(_:FormState,formData:FormData):Promise<FormState>{const parsed=commentSchema.safeParse({articleId:formData.get("articleId"),body:formData.get("body")});if(!parsed.success)return{status:"error",message:"Comments must be between 2 and 2,000 characters."};const supabase=await createSupabaseServerClient();if(!supabase)return{status:"error",message:"Comments are awaiting backend configuration."};const {data:{user}}=await supabase.auth.getUser();if(!user)return{status:"error",message:"Sign in before commenting."};const {error}=await supabase.from("comments").insert({article_id:parsed.data.articleId,user_id:user.id,body:parsed.data.body,status:"pending"});return error?{status:"error",message:"Your comment could not be submitted."}:{status:"success",message:"Comment submitted for moderation."};}
