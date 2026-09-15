import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/article-body";
import { Gallery } from "@/components/gallery";
import { ShareLinks } from "@/components/share-links";
import { getTeamPost } from "@/lib/content";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const post = await getTeamPost(slug); if (!post) return { title: "Update" };
  const cover = post.media.find((item) => item.isCover) ?? post.media[0];
  return { title: post.title, description: post.excerpt ?? post.body.slice(0, 160), openGraph: cover ? { images: [{ url: cover.url, width: cover.width, height: cover.height, alt: cover.altText }] } : undefined };
}
export default async function UpdateDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const post = await getTeamPost(slug); if (!post) notFound();
  return <article className="update-detail shell"><header><span className="eyebrow"><i /> {post.postType.replace("_", " ")}</span><h1>{post.title}</h1><p>{post.excerpt}</p><div className="update-detail-meta"><span>KN1GHTS</span>{post.publishedAt ? <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time> : null}{post.event?.placement ? <strong>Placement #{post.event.placement}</strong> : null}</div></header>{post.media.length ? <Gallery images={post.media} /> : null}{post.event ? <section className="event-facts"><span className="eyebrow">Competition</span><h2>{post.event.name}</h2><dl>{post.event.eventDate ? <><dt>Date</dt><dd>{formatDate(post.event.eventDate)}</dd></> : null}{post.event.placement ? <><dt>Placement</dt><dd>#{post.event.placement}</dd></> : null}{post.event.fieldSize ? <><dt>Field</dt><dd>{post.event.fieldSize} teams</dd></> : null}</dl>{post.event.sourceUrl ? <a className="text-link" href={post.event.sourceUrl} target="_blank" rel="noreferrer">View source</a> : null}</section> : null}<div className="article-layout"><aside className="article-aside">The story</aside><ArticleBody source={post.body} /></div><ShareLinks title={post.title} /></article>;
}
