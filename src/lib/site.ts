export const site = {
  name: "KN1GHTS",
  description: "Competitive cybersecurity. Offensive research. CTFs.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  github: "https://github.com/Kn1ghts-org",
  linkedin: "https://www.linkedin.com/company/kn1ghts/",
};

export const nav = [
  ["Updates", "/updates"],
  ["Achievements", "/achievements"],
  ["Writeups", "/writeups"],
  ["Projects", "/projects"],
  ["Team", "/team"],
  ["Blog", "/blog"],
] as const;
