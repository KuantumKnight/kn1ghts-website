import Link from "next/link";
import { ArrowRight, Crosshair, Flag, ShieldChevron, Sword } from "@phosphor-icons/react/dist/ssr";
import { HeroVisual } from "@/components/hero/hero-visual";
import { SectionHeading } from "@/components/section-heading";
import { UpdateCard } from "@/components/update-card";
import { getArticles, getEvents, getMembers, getProjects, getTeamPosts } from "@/lib/content";

export default async function Home() {
  const [events, writeups, projects, members, posts, updates] = await Promise.all([
    getEvents(), getArticles("writeup"), getProjects(), getMembers(), getArticles("blog"), getTeamPosts(),
  ]);
  const featuredUpdate = updates.find((item) => item.featured) ?? updates[0];

  return (
    <>
      <section className="hero shell">
        <div className="hero-copy">
          <span className="eyebrow"><i /> Competitive cybersecurity · India</span>
          <h1>KN<span>1</span>GHTS</h1>
          <p>Competitive cybersecurity. Offensive research. CTFs.</p>
          <div className="hero-actions">
            <Link className="button" href="/achievements">Explore our work <ArrowRight /></Link>
            <Link className="text-link" href="/team">Meet the team <ArrowRight /></Link>
          </div>
        </div>
        <HeroVisual />
      </section>

      {featuredUpdate ? <section className="home-updates shell section-block"><SectionHeading index="01" title="Latest from KN1GHTS" href="/updates" /><UpdateCard post={featuredUpdate} featured />{updates.length > 1 ? <div className="updates-strip">{updates.filter((item) => item.id !== featuredUpdate.id).slice(0, 3).map((item) => <UpdateCard key={item.id} post={item} />)}</div> : null}</section> : null}

      <section className="manifesto shell section-block">
        <span className="eyebrow">What drives us</span>
        <p>Pressure reveals the <em>pattern.</em><br />Curiosity finds the <em>break.</em></p>
        <div className="manifesto-note">A team forged through competition, focused on understanding how systems fail—and how to make them stronger.</div>
      </section>

      <section className="discipline-band section-block">
        <div className="shell">
          <SectionHeading index="02" title="Our disciplines" />
          <div className="disciplines">
            <div><Crosshair /><span>01</span><h3>Compete</h3><p>High-pressure CTFs across web, pwn, crypto, forensics and OSINT.</p></div>
            <div><ShieldChevron /><span>02</span><h3>Research</h3><p>Technical investigation, offensive experimentation and clear field notes.</p></div>
            <div><Sword /><span>03</span><h3>Build</h3><p>Purposeful tools and challenge infrastructure for the security community.</p></div>
          </div>
        </div>
      </section>

      {events.length ? <section className="shell section-block"><SectionHeading index="03" title="Selected results" href="/achievements" /><div className="editorial-list">{events.slice(0,3).map((event) => <Link href={`/achievements/${event.slug}`} key={event.id}><span>{event.placement ? `#${event.placement}` : "Result"}</span><h3>{event.name}</h3><p>{event.summary}</p><ArrowRight /></Link>)}</div></section> : null}
      {writeups.length ? <section className="shell section-block"><SectionHeading index="04" title="Latest writeups" href="/writeups" /><div className="editorial-list">{writeups.slice(0,3).map((item) => <Link href={`/writeups/${item.slug}`} key={item.id}><span>{item.category ?? "CTF"}</span><h3>{item.title}</h3><p>{item.excerpt}</p><ArrowRight /></Link>)}</div></section> : null}
      {projects.length ? <section className="shell section-block"><SectionHeading index="05" title="Open source" href="/projects" /><div className="editorial-list">{projects.slice(0,3).map((item) => <Link href={`/projects/${item.slug}`} key={item.id}><span>{item.technologies[0] ?? "Tool"}</span><h3>{item.name}</h3><p>{item.description}</p><ArrowRight /></Link>)}</div></section> : null}
      {members.length ? <section className="shell section-block"><SectionHeading index="05" title="The team" href="/team" /><div className="editorial-list">{members.slice(0,4).map((item) => <Link href={`/team/${item.slug}`} key={item.id}><span>@{item.handle}</span><h3>{item.name}</h3><p>{item.specialties.join(" · ")}</p><ArrowRight /></Link>)}</div></section> : null}
      {posts.length ? <section className="shell section-block"><SectionHeading index="06" title="From the field" href="/blog" /><div className="editorial-list">{posts.slice(0,3).map((item) => <Link href={`/blog/${item.slug}`} key={item.id}><span>Journal</span><h3>{item.title}</h3><p>{item.excerpt}</p><ArrowRight /></Link>)}</div></section> : null}

      <section className="recruitment section-block">
        <div className="shell recruitment-inner">
          <div><span className="eyebrow"><i /> Recruitment status</span><h2>The gate is closed.<br /><em>For now.</em></h2></div>
          <div><p>We are not currently accepting applications. Follow our work and check back when the next campaign begins.</p><Link className="text-link" href="/join">How recruitment works <ArrowRight /></Link></div>
          <Flag className="recruitment-mark" weight="thin" />
        </div>
      </section>

      <section className="contact-cta shell section-block">
        <span className="eyebrow">Have a challenge?</span>
        <h2>Bring us something<br />worth <em>breaking.</em></h2>
        <div><Link className="button" href="/contact">Start a conversation <ArrowRight /></Link><p>CTF collaboration · Event hosting · Security research</p></div>
      </section>
    </>
  );
}
