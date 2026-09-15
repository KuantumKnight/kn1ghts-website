"use client";

import { PaperPlaneTilt } from "@phosphor-icons/react";
import { useActionState } from "react";
import { submitContact } from "@/app/actions";
import { initialFormState } from "@/lib/form-state";

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initialFormState);
  return <form action={action} className="form-grid">
    <div className="field"><label htmlFor="name">Name</label><input id="name" name="name" required maxLength={80} /></div>
    <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required maxLength={160} /></div>
    <div className="field full"><label htmlFor="subject">Subject</label><select id="subject" name="subject"><option value="general">General enquiry</option><option value="ctf">CTF or event hosting</option><option value="research">Security research</option><option value="recruitment">Recruitment</option></select></div>
    <div className="field full"><label htmlFor="message">Message</label><textarea id="message" name="message" required minLength={20} maxLength={4000} /></div>
    <div className="sr-only" aria-hidden="true"><label htmlFor="company">Company</label><input id="company" name="company" tabIndex={-1} autoComplete="off" /></div>
    <div className="field full"><button className="button" disabled={pending}>{pending ? "Sending…" : <>Send message <PaperPlaneTilt /></>}</button></div>
    <p className="form-message" role="status" data-status={state.status}>{state.message}</p>
  </form>;
}
