"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="status-page shell"><span className="eyebrow">System interruption</span><h1>We lost the signal.</h1><p>The page could not be loaded. Try the request once more.</p><button className="button" onClick={reset}>Try again</button></section>;
}
