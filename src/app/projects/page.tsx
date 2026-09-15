import type { Metadata } from "next";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { getProjects } from "@/lib/content";
export const metadata: Metadata = { title: "Projects", description: "Open-source tools from KN1GHTS." };
export default async function ProjectsPage() { const projects = await getProjects(); return <><PageIntro eyebrow="Open source" title="Tools made in the field." description="Practical software shaped by competitions, research, and the problems we wanted solved properly." /><section className="content-section shell">{projects.length ? <div className="listing">{projects.map((item) => <Link className="listing-item" href={`/projects/${item.slug}`} key={item.id}><small>{item.stars === null ? "Open source" : `${item.stars} stars`}</small><h2>{item.name}</h2><p>{item.description}</p><ArrowRight /></Link>)}</div> : <EmptyState title="No projects are listed yet." body="Curated KN1GHTS repositories will appear after their maintainers and current status are verified." />}</section></>; }
