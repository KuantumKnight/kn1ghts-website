export type PublishState = "draft" | "submitted" | "changes_requested" | "published" | "archived";

export interface Member {
  id: string;
  slug: string;
  name: string;
  handle: string;
  bio: string | null;
  specialties: string[];
  avatarUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
}

export interface EventRecord {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  eventDate: string | null;
  placement: number | null;
  fieldSize: number | null;
  sourceUrl: string | null;
  featured: boolean;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  kind: "writeup" | "blog";
  category: string | null;
  publishedAt: string | null;
  event?: Pick<EventRecord, "slug" | "name"> | null;
  authors: Pick<Member, "slug" | "name" | "handle">[];
}

export interface ProjectRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  repositoryUrl: string;
  technologies: string[];
  stars: number | null;
  starsUpdatedAt: string | null;
  maintainers: Pick<Member, "slug" | "name" | "handle">[];
}

export type TeamPostType = "ctf_result" | "team_update" | "announcement";

export interface TeamPostMedia {
  id: string;
  url: string;
  altText: string;
  caption: string | null;
  width: number;
  height: number;
  sortOrder: number;
  isCover: boolean;
}

export interface TeamPost {
  id: string;
  slug: string;
  postType: TeamPostType;
  title: string;
  excerpt: string | null;
  body: string;
  featured: boolean;
  publishedAt: string | null;
  event: EventRecord | null;
  media: TeamPostMedia[];
}
