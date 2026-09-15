import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { PageIntro } from "@/components/page-intro";
export const metadata: Metadata = { title: "Contact", description: "Talk to KN1GHTS about CTFs, research, or collaboration." };
export default function ContactPage() { return <><PageIntro eyebrow="Open channel" title="Bring us a challenge." description="For CTF invitations, custom event hosting, research collaboration, or a good technical conversation." /><section className="content-section shell"><div className="form-shell"><ContactForm /></div></section></>; }
