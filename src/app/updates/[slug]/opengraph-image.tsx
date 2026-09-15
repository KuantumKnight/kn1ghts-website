import { ImageResponse } from "next/og";
import { getTeamPost } from "@/lib/content";

export const alt = "KN1GHTS team update";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const post = await getTeamPost(slug);
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "70px", color: "#ede9e0", background: "radial-gradient(circle at 80% 10%, #362426, #111110 45%, #090909)" }}><div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 28, fontWeight: 700, letterSpacing: -1 }}>KN<span style={{ color: "#b51f2d" }}>1</span>GHTS <span style={{ fontSize: 16, color: "#9a9690", textTransform: "uppercase", letterSpacing: 3 }}>{post?.postType.replace("_", " ") ?? "Team update"}</span></div><div style={{ display: "flex", flexDirection: "column", gap: 28 }}><div style={{ maxWidth: 970, fontSize: 72, lineHeight: .98, fontWeight: 700, letterSpacing: -4 }}>{post?.title ?? "From the arena"}</div>{post?.event?.placement ? <div style={{ display: "flex", color: "#d7d1c5", fontSize: 25 }}>{post.event.name} · Placement #{post.event.placement}</div> : null}</div><div style={{ width: 120, height: 7, background: "#a11824" }} /></div>, size);
}
