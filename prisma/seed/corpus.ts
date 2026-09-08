import type { PrismaClient } from "@prisma/client";

/**
 * Illustrative corpus rows.
 *
 * These are NOT real creators and NOT real metrics. They exist so the corpus
 * screens, the outlier banding and the calibration harness can be seen working
 * before anybody has spent an afternoon seeding the real thing.
 *
 * Every row carries `illustrative: true`, which excludes it from calibration:
 * checking a rubric against invented outcomes would produce a confident number
 * about nothing, which is worse than having no number at all.
 *
 * The shape is deliberate, and there are four things being demonstrated:
 *
 *   1. **An outlier needs ordinary content to be an outlier against.** Advisor A
 *      has four routine pieces and one that outperformed. A corpus of nothing
 *      but hits makes everything look typical.
 *   2. **Raw views are not the signal.** Advisor B's 40,000-view piece is
 *      ordinary for a 250,000-follower account and would top any views-ranked
 *      list. It bands `unknown` for want of a baseline, which is correct.
 *   3. **Reach and relevance are different questions.** One row outperformed in
 *      front of the wrong audience — it should read "popular, wrong audience",
 *      which is a warning rather than a template.
 *   4. **`unrated` is a real state.** Two rows are left unrated on purpose, so
 *      the corpus reading has something to be honest about.
 */
const ILLUSTRATIVE = [
  { handle: "@example-advisor-a", name: "Example Advisor A", views: 1_400, followers: 9_000, format: "short_video", buyer: "direct", intent: "commercial", engagement: 0.021, title: "Illustrative: routine explainer, one" },
  { handle: "@example-advisor-a", name: "Example Advisor A", views: 1_600, followers: 9_000, format: "short_video", buyer: "direct", intent: "commercial", engagement: 0.026, title: "Illustrative: routine explainer, two" },
  { handle: "@example-advisor-a", name: "Example Advisor A", views: 1_200, followers: 9_000, format: "short_video", buyer: "direct", intent: "mixed", engagement: 0.018, title: "Illustrative: routine explainer, three" },
  { handle: "@example-advisor-a", name: "Example Advisor A", views: 1_500, followers: 9_000, format: "short_video", buyer: "adjacent", intent: "commercial", engagement: 0.024, title: "Illustrative: routine explainer, four" },
  { handle: "@example-advisor-a", name: "Example Advisor A", views: 11_000, followers: 9_000, format: "short_video", buyer: "direct", intent: "commercial", engagement: 0.048, title: "Illustrative: the one that outperformed" },
  // Same creator, same jump, wrong room. This is the row that shows why the
  // corpus does not treat "went viral" and "worth copying" as one claim.
  { handle: "@example-advisor-a", name: "Example Advisor A", views: 9_500, followers: 9_000, format: "short_video", buyer: "off_icp", intent: "entertainment", engagement: 0.061, title: "Illustrative: outperformed, wrong audience" },
  { handle: "@example-advisor-b", name: "Example Advisor B", views: 40_000, followers: 250_000, format: "long_video", buyer: "unrated", intent: "unrated", engagement: 0.009, title: "Illustrative: large account, ordinary piece" },
  { handle: "@example-advisor-b", name: "Example Advisor B", views: 38_000, followers: 250_000, format: "long_video", buyer: "unrated", intent: "unrated", engagement: 0.011, title: "Illustrative: large account, second piece" },
];

export async function seedCorpus(
  prisma: PrismaClient,
  operatorId: string,
  wedgeId: string,
  daysAgo: (days: number, hour?: number) => Date,
) {
  for (const [index, row] of ILLUSTRATIVE.entries()) {
    await prisma.researchExample.create({
      data: {
        url: `https://example.com/illustrative/${index + 1}`,
        platform: row.format === "long_video" ? "YouTube" : "LinkedIn",
        format: row.format,
        buyerRelevance: row.buyer,
        commercialIntent: row.intent,
        creatorHandle: row.handle,
        creatorName: row.name,
        title: row.title,
        wedgeId,
        publishedAt: daysAgo(60 - index * 5),
        views: row.views,
        // Engagement is varied deliberately. Deriving every count from a fixed
        // multiple of views gives every row an identical rate, which makes the
        // demo look synthetic and — worse — hides the fact that engagement rate
        // and reach are genuinely different signals.
        likes: Math.round(row.views * row.engagement),
        comments: Math.round(row.views * row.engagement * 0.12),
        shares: Math.round(row.views * row.engagement * 0.07),
        saves: Math.round(row.views * row.engagement * 0.2),
        followers: row.followers,
        illustrative: true,
        notes:
          "Placeholder row shipped with the seed. Not a real creator, not real metrics, and excluded from calibration.",
        addedById: operatorId,
      },
    });
  }
}
