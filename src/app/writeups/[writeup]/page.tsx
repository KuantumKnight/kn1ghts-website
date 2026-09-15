import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleDetail } from "@/components/article-detail";
import { getArticle } from "@/lib/content";
export async function generateMetadata({ params }: { params: Promise<{ writeup: string }> }): Promise<Metadata> { const { writeup } = await params; const article = await getArticle("writeup", writeup); return { title: article?.title ?? "Writeup", description: article?.excerpt }; }
export default async function WriteupPage({ params }: { params: Promise<{ writeup: string }> }) { const { writeup } = await params; const article = await getArticle("writeup", writeup); if (!article) notFound(); return <ArticleDetail article={article} />; }
