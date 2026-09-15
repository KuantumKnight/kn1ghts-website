import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request:Request){
  const expected=process.env.CRON_SECRET;const supplied=request.headers.get("authorization");
  if(!expected||supplied!==`Bearer ${expected}`)return NextResponse.json({error:"Unauthorized"},{status:401});
  const supabase=createSupabaseAdminClient();if(!supabase)return NextResponse.json({error:"Backend not configured"},{status:503});
  const {data:projects,error}=await supabase.from("projects").select("id,repository_url");if(error)return NextResponse.json({error:error.message},{status:500});
  let updated=0;
  for(const project of projects??[]){const match=project.repository_url.match(/^https:\/\/github\.com\/([^/]+)\/([^/#?]+)/);if(!match)continue;const response=await fetch(`https://api.github.com/repos/${match[1]}/${match[2]}`,{headers:{Accept:"application/vnd.github+json",...(process.env.GITHUB_TOKEN?{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`}:{})}});if(!response.ok)continue;const payload=await response.json() as {stargazers_count?:number};if(typeof payload.stargazers_count!=="number")continue;await supabase.from("projects").update({stars:payload.stargazers_count,stars_updated_at:new Date().toISOString()}).eq("id",project.id);updated++;}
  return NextResponse.json({updated});
}
