import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleDetail } from "@/components/article-detail";
import { getArticle } from "@/lib/content";
export async function generateMetadata({ params }: { params: Promise<{ post: string }> }): Promise<Metadata> { const { post } = await params; const article = await getArticle("blog", post); return { title: article?.title ?? "Article", description: article?.excerpt }; }
export default async function BlogPostPage({ params }: { params: Promise<{ post: string }> }) { const { post } = await params; const article = await getArticle("blog", post); if (!article) notFound(); return <ArticleDetail article={article} />; }
