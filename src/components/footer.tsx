import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { site } from "@/lib/site";
import { Wordmark } from "@/components/wordmark";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Wordmark />
          <p className="footer-statement">We break systems to understand them—and build better ones.</p>
        </div>
        <div className="footer-links">
          <span className="eyebrow">Elsewhere</span>
          <a href={site.github} target="_blank" rel="noreferrer">GitHub <ArrowUpRight /></a>
          <a href={site.linkedin} target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight /></a>
        </div>
        <div className="footer-links">
          <span className="eyebrow">More</span>
          <Link href="/updates">Team updates</Link>
          <Link href="/join">Join the team</Link>
          <Link href="/security">Security</Link>
          <Link href="/login">Member login</Link>
        </div>
      </div>
      <div className="shell footer-meta">
        <span>© {new Date().getFullYear()} KN1GHTS</span>
        <span>Chennai, India · Operating globally</span>
      </div>
    </footer>
  );
}
