import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { TeamPost } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function UpdateCard({ post, featured = false }: { post: TeamPost; featured?: boolean }) {
  const cover = post.media.find((item) => item.isCover) ?? post.media[0];
  return <Link href={`/updates/${post.slug}`} className={featured ? "update-card featured" : "update-card"}>
    <div className="update-card-media">{cover ? <Image src={cover.url} alt={cover.altText} fill sizes={featured ? "(max-width: 900px) 100vw, 65vw" : "(max-width: 900px) 100vw, 40vw"} /> : <div className="update-placeholder"><span>KN<span>1</span>GHTS</span></div>}<span className="update-kind">{post.postType.replace("_", " ")}</span>{post.event?.placement ? <strong className="placement-badge">#{post.event.placement}</strong> : null}</div>
    <div className="update-card-copy"><div className="update-byline"><span>KN1GHTS</span>{post.publishedAt ? <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time> : <span>Date not published</span>}</div><h2>{post.title}</h2><p>{post.excerpt ?? post.body.slice(0, 180)}</p>{post.event ? <small>{post.event.name}{post.event.fieldSize ? ` · ${post.event.fieldSize} teams` : ""}</small> : null}<span className="read-update">Read update <ArrowRight /></span></div>
  </Link>;
}
