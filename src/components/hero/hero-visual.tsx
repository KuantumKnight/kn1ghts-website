"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const KnightScene = dynamic(
  () => import("@/components/hero/knight-scene").then((mod) => mod.KnightScene),
  { ssr: false },
);

export function HeroVisual() {
  const root = useRef<HTMLDivElement>(null);
  const [canAnimate, setCanAnimate] = useState(false);
  const [visible, setVisible] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 900px)").matches;
    const timer = window.setTimeout(
      () => setCanAnimate(!reduced && desktop && "WebGLRenderingContext" in window),
      0,
    );
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "100px",
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={root} className="hero-visual" aria-label="Sculptural knight monument">
      <Image
        src="/images/knight-poster.png"
        alt="Weathered knight standing in a dark stone hall"
        fill
        priority
        sizes="(max-width: 899px) 100vw, 58vw"
        className="hero-poster"
      />
      {canAnimate && visible && !failed ? (
        <div className="hero-canvas" onError={() => setFailed(true)}>
          <KnightScene />
        </div>
      ) : null}
      <span className="visual-index" aria-hidden="true">01 / FIELD NOTES</span>
    </div>
  );
}
