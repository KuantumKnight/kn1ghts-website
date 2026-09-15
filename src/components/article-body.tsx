"use client";

import { Check, Copy } from "@phosphor-icons/react";
import { Children, isValidElement, type ReactNode, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

function textFromChildren(children: ReactNode): string {
  return Children.toArray(children).map((child) => {
    if (typeof child === "string") return child;
    if (isValidElement<{ children?: ReactNode }>(child)) return textFromChildren(child.props.children);
    return "";
  }).join("");
}

function CodeBlock({ children }: { children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const value = textFromChildren(children).replace(/\n$/, "");
  return (
    <div className="code-block">
      <button type="button" onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }} aria-label="Copy code">
        {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy"}
      </button>
      <pre>{children}</pre>
    </div>
  );
}

export function ArticleBody({ source }: { source: string }) {
  return (
    <article className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        skipHtml
        components={{ pre: ({ children }) => <CodeBlock>{children}</CodeBlock> }}
      >
        {source}
      </ReactMarkdown>
    </article>
  );
}
