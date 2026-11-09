/**
 * Source routing (BUILD-03, 9 Nov 2026).
 *
 * Every source gets one route before it is mined. Only public-eligible material
 * may reach a writer; internal sales material can still be read by staff as
 * conversion intelligence, but never becomes drafting context or idea evidence.
 *
 * The route lives on existing fields (Asset.tags, ResearchItem.sourceMeta), so
 * this needs no migration. Items with no route predate routing or were not
 * mined (competitor posts, pasted research) and are unaffected.
 */
export const SOURCE_ROUTES = [
  "PUBLIC_CONTENT_ELIGIBLE",
  "INTERNAL_CONVERSION_ONLY",
  "PRIVATE_CLIENT_DELIVERY",
  "EXCLUDED",
] as const;
export type SourceRoute = (typeof SOURCE_ROUTES)[number];

export const SOURCE_ROUTE_LABEL: Record<SourceRoute, string> = {
  PUBLIC_CONTENT_ELIGIBLE: "Public content",
  INTERNAL_CONVERSION_ONLY: "Internal sales only",
  PRIVATE_CLIENT_DELIVERY: "Private to client",
  EXCLUDED: "Excluded",
};

const TAG_PREFIX = "route:";

export function isSourceRoute(v: unknown): v is SourceRoute {
  return typeof v === "string" && (SOURCE_ROUTES as readonly string[]).includes(v);
}

/** The route recorded in a list of asset tags, or null if it was never routed. */
export function routeFromTags(tags: readonly string[]): SourceRoute | null {
  for (const t of tags) {
    if (t.startsWith(TAG_PREFIX)) {
      const r = t.slice(TAG_PREFIX.length);
      if (isSourceRoute(r)) return r;
    }
  }
  return null;
}

/** The same tags with the route replaced. Other tags are kept in order. */
export function withRouteTag(tags: readonly string[], route: SourceRoute): string[] {
  return [...tags.filter((t) => !t.startsWith(TAG_PREFIX)), `${TAG_PREFIX}${route}`];
}

/**
 * Prisma filter for research a writer may use. Spread it into a ResearchItem
 * `where`. It keeps unrouted items and drops all three non-public routes.
 */
export function draftableResearch() {
  return {
    NOT: SOURCE_ROUTES.filter((r) => r !== "PUBLIC_CONTENT_ELIGIBLE").map((r) => ({
      sourceMeta: { contains: `"sourceRoute":"${r}"` },
    })),
  };
}
