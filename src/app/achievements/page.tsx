import type { Metadata } from "next";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { getEvents, getTeamPosts } from "@/lib/content";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Achievements", description: "Verified KN1GHTS competition results." };
export default async function AchievementsPage() {
  const [events, posts] = await Promise.all([getEvents(), getTeamPosts()]);
  return <><PageIntro eyebrow="Competition record" title="Proven under pressure." description="A sourced archive of the events that tested us, the teams we faced, and the work that got us through." /><section className="content-section shell">{events.length ? <div className="achievement-grid">{events.map((event) => { const post = posts.find((item) => item.event?.slug === event.slug); const cover = post?.media.find((item) => item.isCover) ?? post?.media[0]; return <Link href={`/achievements/${event.slug}`} key={event.id}><div className="achievement-image">{cover ? <Image src={cover.url} alt={cover.altText} fill sizes="(max-width: 800px) 100vw, 50vw" /> : <div className="update-placeholder"><span>KN<span>1</span>GHTS</span></div>} {event.placement ? <strong className="placement-badge">#{event.placement}</strong> : null}</div><div className="achievement-copy"><div>{event.eventDate ? <small>{formatDate(event.eventDate)}</small> : <small>Date not published</small>}<ArrowRight /></div><h2>{event.name}</h2><p>{event.summary}</p></div></Link>; })}</div> : <EmptyState title="The record is being verified." body="Results will appear here after dates, team rosters, placements, and source links have been checked." />}</section></>;
}
