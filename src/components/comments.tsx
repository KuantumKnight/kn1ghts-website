"use client";
import Link from "next/link";
import { useActionState } from "react";
import { submitComment } from "@/app/actions";
import { initialFormState } from "@/lib/form-state";
export function CommentForm({articleId,signedIn}:{articleId:string;signedIn:boolean}){const[state,action,pending]=useActionState(submitComment,initialFormState);if(!signedIn)return <p className="comment-login"><Link href="/login">Sign in</Link> to join the discussion.</p>;return <form action={action} className="comment-form"><input type="hidden" name="articleId" value={articleId}/><div className="field"><label htmlFor="comment">Add a comment</label><textarea id="comment" name="body" minLength={2} maxLength={2000} required/></div><button className="button" disabled={pending}>{pending?"Submitting…":"Submit for review"}</button><p className="form-message" role="status" data-status={state.status}>{state.message}</p></form>}
export function Comments({items}:{items:{id:string;body:string;createdAt:string;author:string}[]}){return <div className="comments-list">{items.map((item)=><article key={item.id}><header><strong>{item.author}</strong><time dateTime={item.createdAt}>{new Intl.DateTimeFormat("en",{day:"numeric",month:"short",year:"numeric"}).format(new Date(item.createdAt))}</time></header><p>{item.body}</p></article>)}</div>}
