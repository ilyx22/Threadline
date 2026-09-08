import { z } from "zod";

/**
 * Public application form contract.
 *
 * Lives outside `src/lib/actions` because a `"use server"` module may only
 * export async functions — the schema and option lists are shared with the
 * client form and the admin inbox, so they belong in the domain layer.
 */

export const applicationSchema = z.object({
  name: z.string().min(2, "Enter your name.").max(120),
  email: z.string().email("Enter a valid email address.").max(200),
  company: z.string().min(2, "Enter your company.").max(200),
  website: z.string().max(300).optional(),
  whatYouSell: z.string().min(10, "Tell us what you sell.").max(2000),
  revenueRange: z.string().min(1, "Choose a range.").max(80),
  contentProcess: z.string().min(10, "Describe how content gets made today.").max(2000),
  peopleInvolved: z.string().min(1, "Choose an option.").max(80),
  publishCadence: z.string().min(1, "Choose an option.").max(80),
  biggestBottleneck: z.string().min(5, "What is the biggest bottleneck?").max(2000),
  founderHours: z.string().min(1, "Choose an option.").max(80),
  platforms: z.union([z.string(), z.array(z.string())]).optional(),
  successLooksLike: z.string().min(10, "Describe what success looks like.").max(2000),
  urgency: z.string().min(1, "Choose an option.").max(80),
  extra: z.string().max(4000).optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

export const APPLICATION_OPTIONS = {
  revenueRange: [
    "Under £250k",
    "£250k – £1m",
    "£1m – £5m",
    "£5m – £20m",
    "Over £20m",
    "Prefer not to say",
  ],
  peopleInvolved: ["Just me", "2 – 3", "4 – 6", "7 or more"],
  publishCadence: [
    "Not consistently",
    "A few times a month",
    "Weekly",
    "2 – 3 times a week",
    "Daily",
  ],
  founderHours: ["Under 2 hours", "2 – 5 hours", "5 – 10 hours", "Over 10 hours"],
  platforms: ["LinkedIn", "YouTube", "Instagram", "TikTok", "X", "Newsletter", "Podcast"],
  urgency: ["Yes — this is a priority now", "Within the next quarter", "Exploring, no timeline"],
} as const;

/**
 * Application steps. Kept here so the form, its progress indicator and the
 * admin review view all describe the same shape.
 */
export const APPLICATION_STEPS = [
  {
    key: "about",
    title: "About you",
    description: "Who you are and what the business does.",
    fields: ["name", "email", "company", "website", "whatYouSell", "revenueRange"],
  },
  {
    key: "operation",
    title: "Your content operation",
    description: "How content actually gets made today.",
    fields: ["contentProcess", "peopleInvolved", "publishCadence", "founderHours", "platforms"],
  },
  {
    key: "outcome",
    title: "What you want",
    description: "The constraint to remove and what good looks like.",
    fields: ["biggestBottleneck", "successLooksLike", "urgency", "extra"],
  },
] as const;

export type ApplicationStepKey = (typeof APPLICATION_STEPS)[number]["key"];
