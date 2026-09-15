import type { Metadata } from "next";
import { ArrowUpRight, Star } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/content";
export async function generateMetadata({ params }: { params: Promise<{ project: string }> }): Promise<Metadata> { const { project } = await params; const item = await getProject(project); return { title: item?.name ?? "Project", description: item?.description }; }
export default async function ProjectPage({ params }: { params: Promise<{ project: string }> }) { const { project } = await params; const item = await getProject(project); if (!item) notFound(); return <section className="detail shell"><header className="detail-header"><span className="eyebrow">Open source</span><div><h1>{item.name}</h1><p>{item.description}</p><div className="tag-row">{item.technologies.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="profile-links"><a className="button" href={item.repositoryUrl} target="_blank" rel="noreferrer">View source <ArrowUpRight /></a>{item.stars !== null ? <span className="star-count"><Star /> {item.stars} stars</span> : null}</div></div></header></section>; }
