import Link from "next/link";

export function Wordmark() {
  return (
    <Link href="/" className="wordmark" aria-label="KN1GHTS home">
      KN<span>1</span>GHTS
    </Link>
  );
}
