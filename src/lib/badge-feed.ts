import { createServerFn } from "@tanstack/react-start";
import type { BadgeFeed } from "./badge-types";

export const getBadgeFeed = createServerFn({ method: "GET" }).handler(
  async (): Promise<BadgeFeed> => {
    const { loadFeed } = await import("./badgebase.server");
    return loadFeed();
  },
);
