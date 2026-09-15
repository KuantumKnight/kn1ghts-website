import type { Metadata } from "next";
import { ArticleList } from "@/components/article-list";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { getArticles } from "@/lib/content";
import "@/components/archive-tools.css";

export const metadata: Metadata = { title: "Writeups", description: "KN1GHTS CTF challenge solutions and field reports." };
export default async function WriteupsPage() { const items = await getArticles("writeup"); return <><PageIntro eyebrow="Field reports" title="How the flag fell." description="Reproducible challenge solutions, dead ends included. Search by event, category, or technique." /><section className="content-section shell">{items.length ? <ArticleList items={items} kind="writeups" /> : <EmptyState title="No writeups published yet." body="Approved challenge solutions will appear here with their event, author, and technical category." />}</section></>; }
