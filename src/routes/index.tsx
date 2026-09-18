import { createFileRoute } from "@tanstack/react-router";
import { BadgeOverlay } from "@/components/badge-overlay";
import { getBadgeFeed } from "@/lib/badge-feed";

type Search = {
  channel?: string;
  interval?: number;
};

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    channel: typeof s.channel === "string" ? s.channel : undefined,
    interval:
      typeof s.interval === "string" || typeof s.interval === "number"
        ? Number(s.interval)
        : undefined,
  }),
  loader: () => getBadgeFeed(),
  component: Home,
});

function Home() {
  const { channel, interval } = Route.useSearch();
  const initial = Route.useLoaderData();
  return (
    <BadgeOverlay
      channelParam={channel}
      intervalSec={Number.isFinite(interval) ? interval : 8}
      initialFeed={initial}
    />
  );
}
