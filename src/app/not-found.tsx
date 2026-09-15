import Link from "next/link";

export default function NotFound() {
  return <section className="status-page shell"><span className="eyebrow">404 / Lost sector</span><h1>Nothing was found here.</h1><p>The requested record may be unpublished or no longer available.</p><Link className="button" href="/">Return home</Link></section>;
}
