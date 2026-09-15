import type { Metadata } from "next";
import { ApplicationForm } from "@/components/application-form";
import { PageIntro } from "@/components/page-intro";
export const metadata: Metadata = { title: "Join", description: "KN1GHTS recruitment." };
export default function JoinPage() { return <><PageIntro eyebrow="Recruitment / Closed" title="Earn your place at the table." description="We recruit deliberately, when the team has room to mentor and a clear need for another specialist." /><section className="content-section shell form-shell"><div className="notice-band"><span>Current status</span><strong>Applications are closed</strong><p>The form is ready and will unlock when recruitment opens. Sign in first so an application remains attached to your account.</p></div><ApplicationForm /></section></>; }
