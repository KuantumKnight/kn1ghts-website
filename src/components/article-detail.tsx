import Link from "next/link";
import { ArticleBody } from "@/components/article-body";
import { CommentForm, Comments } from "@/components/comments";
import type { Article } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { getComments } from "@/lib/content";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function ArticleDetail({ article }: { article: Article }) {
  const [comments,supabase]=await Promise.all([getComments(article.id),createSupabaseServerClient()]);
  const signedIn=supabase?Boolean((await supabase.auth.getUser()).data.user):false;
  return (
    <section className="detail shell">
      <header className="detail-header">
        <span className="eyebrow">{article.kind === "writeup" ? "Field report" : "Journal"}</span>
        <div>
          <h1>{article.title}</h1>
          {article.excerpt ? <p>{article.excerpt}</p> : null}
          <div className="detail-meta">
            {article.publishedAt ? <span>{formatDate(article.publishedAt)}</span> : null}
            {article.category ? <span>{article.category}</span> : null}
            {article.event ? <Link href={`/achievements/${article.event.slug}`}>{article.event.name}</Link> : null}
            {article.authors.length ? <span>By {article.authors.map((author) => author.name).join(", ")}</span> : null}
          </div>
        </div>
      </header>
      <div className="article-layout">
        <aside className="article-aside">Document / {article.slug}</aside>
        <ArticleBody source={article.body} />
      </div>
      <section className="discussion"><span className="eyebrow">Discussion / {comments.length}</span><h2>Continue the thread.</h2><Comments items={comments}/><CommentForm articleId={article.id} signedIn={signedIn}/></section>
    </section>
  );
}
