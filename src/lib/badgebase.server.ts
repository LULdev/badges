import type { Badge, BadgeFeed, BadgeHow, BadgeStatus } from "./badge-types";
import fallbackJson from "./badge-fallback.json";

const BASE = "https://badgebase.de";
const UA = "TwitchBadgesLiveTracker/1.0 (+stream overlay)";
const CACHE_MS = 8 * 60 * 1000;
const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

const fallback = fallbackJson as Badge[];

type Cache = { at: number; feed: BadgeFeed };
let cache: Cache | null = null;

async function fetchHtml(path: string): Promise<string> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "user-agent": UA, accept: "text/html" },
    signal: AbortSignal.timeout(18000),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.text();
}

function decode(s: string): string {
  return s
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/'/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function strip(s: string): string {
  return decode(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function attr(block: string, name: string): string | null {
  const m = block.match(new RegExp(`${name}="([^"]*)"`));
  return m ? decode(m[1]) : null;
}

function parseStamp(raw: string, year: number): string | null {
  const m = raw.trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const mo = MONTHS[m[1]];
  if (!mo) return null;
  const day = Number(m[2]);
  const hour = Number(m[3]);
  const min = Number(m[4]);
  const off = mo >= 3 && mo <= 10 ? "+02:00" : "+01:00";
  const mm = String(mo).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const mi = String(min).padStart(2, "0");
  return `${year}-${mm}-${dd}T${hh}:${mi}:00${off}`;
}

function parseTip(tip: string | null): { start: string | null; end: string | null } {
  if (!tip || /TBA/i.test(tip)) return { start: null, end: null };
  const year = new Date().getFullYear();
  const parts = tip.split("→").map((p) => p.trim());
  const start = parts[0] ? parseStamp(parts[0], year) : null;
  let endYear = year;
  const m1 = parts[0]?.match(/^([A-Za-z]+)/);
  const m2 = parts[1]?.match(/^([A-Za-z]+)/);
  if (m1 && m2 && MONTHS[m1[1]] && MONTHS[m2[1]] && MONTHS[m1[1]] > MONTHS[m2[1]]) {
    endYear = year + 1;
  }
  const end = parts[1] ? parseStamp(parts[1], endYear) : null;
  return { start, end };
}

function inferHow(tags: string[], free: boolean): BadgeHow {
  if (tags.includes("twitchcon") || tags.includes("ticket")) return "ticket";
  if (!free) return "sub";
  return "watch";
}

type Card = {
  id: string;
  status: BadgeStatus;
  tags: string[];
  collectors: number | null;
  href: string;
  image: string;
  name: string;
};

function parseCards(html: string, fallbackStatus: BadgeStatus): Card[] {
  const blocks = html.match(/<a[^>]*data-badge-id="[^"]+"[\s\S]*?<\/a>/g) ?? [];
  const out: Card[] = [];
  for (const block of blocks) {
    const id = attr(block, "data-badge-id");
    const href = attr(block, "href");
    const img = block.match(/<img[^>]+src="([^"]+)"/);
    const title = block.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/);
    if (!id || !href || !img || !title) continue;
    const tags = (attr(block, "data-tags") ?? "").split(",").map((t) => t.trim()).filter(Boolean);
    const countRaw = attr(block, "data-count");
    const collectors = countRaw ? Number(countRaw) : null;
    const status = (attr(block, "data-status") as BadgeStatus) || fallbackStatus;
    out.push({
      id,
      status,
      tags,
      collectors: Number.isFinite(collectors) ? collectors : null,
      href,
      image: img[1],
      name: strip(title[1]),
    });
  }
  return out;
}

type TimelineRow = {
  id: string;
  href: string;
  image: string;
  name: string;
  label: string;
  start: string | null;
  end: string | null;
};

function parseTimeline(html: string): TimelineRow[] {
  const blocks = html.match(/<a href="\/b\/[^"]+" class="tl-row"[\s\S]*?<\/a>/g) ?? [];
  const out: TimelineRow[] = [];
  for (const block of blocks) {
    const id = block.match(/id="tl-row-(\d+)"/)?.[1];
    const href = attr(block, "href");
    const img = block.match(/src="([^"]+)"/)?.[1];
    const name = block.match(/class="tl-title">([\s\S]*?)<\/span>/);
    const label = block.match(/class="tl-bar-label">([\s\S]*?)<\/span>/);
    const tip = attr(block, "data-tip");
    if (!id || !href || !img || !name) continue;
    const { start, end } = parseTip(tip);
    out.push({
      id,
      href,
      image: img,
      name: strip(name[1]),
      label: label ? strip(label[1]) : "",
      start,
      end,
    });
  }
  return out;
}

async function fetchDetails(href: string): Promise<{ description: string; howText: string }> {
  const html = await fetchHtml(href);
  const p = html.match(/<p class="text-slate-400[^"]*"[^>]*>([\s\S]*?)<\/p>/);
  const description = p ? strip(p[1]) : "";
  let howText = "";
  const blocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) ?? [];
  for (const block of blocks) {
    const raw = block.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    try {
      const data = JSON.parse(raw) as { "@type"?: string; step?: { text?: string }[] };
      if (data["@type"] === "HowTo" && Array.isArray(data.step)) {
        howText = data.step.map((s) => s.text ?? "").filter(Boolean).join(" ");
        break;
      }
    } catch {
      /* skip malformed ld+json */
    }
  }
  return { description, howText };
}

function mergeBadge(card: Card, row?: TimelineRow, extra?: { description: string; howText: string }): Badge {
  const tags = card.tags;
  const free = !tags.includes("paid");
  const prev = fallback.find((b) => b.id === card.id);
  return {
    id: card.id,
    name: card.name,
    href: card.href,
    url: `${BASE}${card.href}`,
    image: card.image,
    status: card.status,
    free,
    how: inferHow(tags, free),
    tags,
    collectors: card.collectors && card.collectors > 0 ? card.collectors : prev?.collectors ?? null,
    start: row?.start ?? prev?.start ?? null,
    end: row?.end ?? prev?.end ?? null,
    description: extra?.description || prev?.description || "",
    howText: extra?.howText || prev?.howText || "",
  };
}

async function scrapeLive(): Promise<Badge[]> {
  const [activeHtml, upcomingHtml, timelineHtml] = await Promise.all([
    fetchHtml("/active/"),
    fetchHtml("/upcoming/"),
    fetchHtml("/timeline/"),
  ]);
  const active = parseCards(activeHtml, "active");
  const upcoming = parseCards(upcomingHtml, "upcoming");
  const timeline = parseTimeline(timelineHtml);
  const rows = new Map(timeline.map((r) => [r.id, r]));

  const cards = [
    ...active.map((c) => ({ ...c, status: "active" as const })),
    ...upcoming.map((c) => ({ ...c, status: "upcoming" as const })),
  ];

  const missing = cards.filter((c) => {
    const prev = fallback.find((b) => b.id === c.id);
    return !prev?.description;
  });

  const details = new Map<string, { description: string; howText: string }>();
  const queue = missing.slice(0, 8);
  await Promise.all(
    queue.map(async (c) => {
      try {
        details.set(c.href, await fetchDetails(c.href));
      } catch {
        /* keep fallback empty desc */
      }
    }),
  );

  const badges = cards.map((c) => mergeBadge(c, rows.get(c.id), details.get(c.href)));
  badges.sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    const ae = a.end ?? "9999";
    const be = b.end ?? "9999";
    return ae.localeCompare(be);
  });
  return badges;
}

export async function loadFeed(): Promise<BadgeFeed> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.feed;
  try {
    const badges = await scrapeLive();
    if (!badges.length) throw new Error("empty scrape");
    const feed: BadgeFeed = {
      fetchedAt: new Date().toISOString(),
      source: "live",
      badges,
    };
    cache = { at: Date.now(), feed };
    return feed;
  } catch (err) {
    const feed: BadgeFeed = {
      fetchedAt: new Date().toISOString(),
      source: "fallback",
      badges: fallback,
    };
    cache = { at: Date.now() - CACHE_MS + 60_000, feed };
    console.error("[badgebase] scrape failed, using snapshot", err);
    return feed;
  }
}
