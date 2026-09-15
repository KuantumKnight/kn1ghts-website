import type { Metadata } from "next";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { getMembers } from "@/lib/content";
export const metadata: Metadata = { title: "Team", description: "The people behind KN1GHTS." };
export default async function TeamPage() { const members = await getMembers(); return <><PageIntro eyebrow="The collective" title="Different instincts. One team." description="Competitors, researchers, builders, and the people who keep pushing the solve forward." /><section className="content-section shell">{members.length ? <div className="listing">{members.map((member) => <Link className="listing-item" href={`/team/${member.slug}`} key={member.id}><small>@{member.handle}</small><h2>{member.name}</h2><p>{member.specialties.join(" · ")}</p><ArrowRight /></Link>)}</div> : <EmptyState title="The roster is being assembled." body="Profiles will appear after each member has approved their name, photo, specialties, and links." />}</section></>; }
