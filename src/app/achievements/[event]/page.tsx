import type { Metadata } from "next";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/article-body";
import { Gallery } from "@/components/gallery";
import { getEvent, getTeamPosts } from "@/lib/content";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ event: string }> }): Promise<Metadata> { const { event } = await params; const item = await getEvent(event); return { title: item?.name ?? "Achievement" }; }
export default async function AchievementDetail({ params }: { params: Promise<{ event: string }> }) {
  const { event } = await params; const [item, posts] = await Promise.all([getEvent(event), getTeamPosts()]); if (!item) notFound();
  const post = posts.find((entry) => entry.event?.slug === item.slug);
  return <section className="detail shell"><header className="detail-header"><span className="eyebrow">Competition record</span><div><h1>{item.name}</h1><p>{item.summary}</p><div className="detail-meta">{item.eventDate ? <span>{formatDate(item.eventDate)}</span> : null}{item.placement ? <span>Placement #{item.placement}</span> : null}{item.fieldSize ? <span>{item.fieldSize} teams</span> : null}</div>{item.sourceUrl ? <a className="text-link detail-source" href={item.sourceUrl} target="_blank" rel="noreferrer">View evidence <ArrowUpRight /></a> : null}</div></header>{post?.media.length ? <Gallery images={post.media} /> : null}{post ? <div className="article-layout"><aside className="article-aside">Event story</aside><ArticleBody source={post.body} /></div> : null}</section>;
}
