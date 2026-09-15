"use client";

import { GithubLogo } from "@phosphor-icons/react";
import { useActionState } from "react";
import { signInWithEmail, signInWithGitHub } from "@/app/actions";
import { initialFormState } from "@/lib/form-state";
export function LoginForm() { const [state, action, pending] = useActionState(signInWithEmail, initialFormState); const githubEnabled=process.env.NEXT_PUBLIC_GITHUB_AUTH_ENABLED==="true"; return <div className="auth-panel">{githubEnabled?<><form action={signInWithGitHub}><button className="button" type="submit"><GithubLogo size={19} /> Continue with GitHub</button></form><div className="auth-divider">or</div></>:null}<form action={action}><div className="field"><label htmlFor="login-email">Email address</label><input id="login-email" name="email" type="email" required /></div><button className="button" disabled={pending}>{pending ? "Sending…" : "Send magic link"}</button><p className="form-message" role="status">{state.message}</p></form></div>; }
