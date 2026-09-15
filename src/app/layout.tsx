import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { site } from "@/lib/site";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "KN1GHTS — Competitive Cybersecurity", template: "%s — KN1GHTS" },
  description: site.description,
  openGraph: {
    title: "KN1GHTS — Competitive Cybersecurity",
    description: site.description,
    type: "website",
    images: [{ url: "/images/knight-poster.png", width: 1680, height: 945 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${mono.variable}`}>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
