"use client";

import { ArrowRight, MagnifyingGlass } from "@phosphor-icons/react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import type { Article } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ArticleList({ items, kind }: { items: Article[]; kind: "writeups" | "blog" }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const deferredQuery = useDeferredValue(query);
  const categories = useMemo(() => ["all", ...Array.from(new Set(items.map((x) => x.category).filter(Boolean) as string[]))], [items]);
  const filtered = useMemo(() => items.filter((item) => {
    const haystack = `${item.title} ${item.excerpt ?? ""} ${item.event?.name ?? ""}`.toLowerCase();
    return haystack.includes(deferredQuery.toLowerCase()) && (category === "all" || item.category === category);
  }), [items, deferredQuery, category]);

  return (
    <>
      <div className="archive-tools">
        <label className="search-field"><MagnifyingGlass size={18} /><span className="sr-only">Search articles</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${kind}`} /></label>
        {categories.length > 1 ? <label className="category-field"><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item} value={item}>{item === "all" ? "All categories" : item}</option>)}</select></label> : null}
      </div>
      <div className="listing">
        {filtered.map((item) => (
          <Link className="listing-item" href={`/${kind}/${item.slug}`} key={item.id}>
            <small>{item.category ?? (kind === "blog" ? "Journal" : "CTF")}</small>
            <h2>{item.title}</h2>
            <p>{item.excerpt}</p>
            <ArrowRight />
            <span className="item-date">{formatDate(item.publishedAt)}</span>
          </Link>
        ))}
      </div>
      {!filtered.length ? <div className="empty-inline">No articles match this search.</div> : null}
    </>
  );
}
