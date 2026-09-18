export type BadgeHow = "watch" | "sub" | "ticket";
export type BadgeStatus = "active" | "upcoming" | "ended";

export type Badge = {
  id: string;
  name: string;
  href: string;
  url: string;
  image: string;
  status: BadgeStatus;
  free: boolean;
  how: BadgeHow;
  tags: string[];
  collectors: number | null;
  start: string | null;
  end: string | null;
  description: string;
  howText: string;
};

export type BadgeFeed = {
  fetchedAt: string;
  source: "live" | "fallback";
  badges: Badge[];
};
