import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { PageIntro } from "@/components/page-intro";
export const metadata: Metadata = { title: "Member login" };
export default function LoginPage() { return <><PageIntro eyebrow="Member access" title="Return to the table." description="Sign in to comment, manage your account, or—after team approval—submit work for editorial review." /><section className="content-section shell"><LoginForm /></section></>; }
