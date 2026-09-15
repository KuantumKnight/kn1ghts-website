import "server-only";
import { createClient } from "@supabase/supabase-js";
export function createSupabaseAdminClient(){if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SECRET_KEY)return null;return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});}
