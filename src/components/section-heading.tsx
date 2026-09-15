import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export function SectionHeading({ index, title, href }: { index: string; title: string; href?: string }) {
  return (
    <div className="section-heading">
      <div><span className="section-index">{index}</span><h2>{title}</h2></div>
      {href ? <Link href={href}>View archive <ArrowRight /></Link> : null}
    </div>
  );
}
