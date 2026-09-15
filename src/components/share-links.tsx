"use client";

import { Check, Copy, LinkedinLogo } from "@phosphor-icons/react";
import { useState } from "react";

export function ShareLinks({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const share = () => encodeURIComponent(window.location.href);
  return <div className="share-links"><button type="button" onClick={async () => { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy link"}</button><button type="button" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${share()}`, "_blank", "noopener,noreferrer")}><LinkedinLogo /> Share on LinkedIn<span className="sr-only">: {title}</span></button></div>;
}
