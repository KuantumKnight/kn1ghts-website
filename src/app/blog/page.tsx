import type { Metadata } from "next";
import { ArticleList } from "@/components/article-list";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { getArticles } from "@/lib/content";
import "@/components/archive-tools.css";
export const metadata: Metadata = { title: "Blog", description: "Notes and lessons from the KN1GHTS team." };
export default async function BlogPage() { const items = await getArticles("blog"); return <><PageIntro eyebrow="The journal" title="Things worth sharing." description="Research notes, lessons learned, and ideas our members want to leave better documented than they found them." /><section className="content-section shell">{items.length ? <ArticleList items={items} kind="blog" /> : <EmptyState title="The first dispatch is in review." body="Member articles will appear here after editorial review." />}</section></>; }
