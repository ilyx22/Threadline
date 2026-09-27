import { z } from "zod";

const checkboxValue = z.union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()]);

/**
 * A checkbox. Tolerates the value arriving more than once (a styled checkbox
 * renders its own hidden input, and a form may add another with the same name;
 * parseForm turns repeated keys into an array): checked when any copy says so.
 */
export const checkbox = z
  .union([checkboxValue, z.array(checkboxValue)])
  .optional()
  .transform((v) => (Array.isArray(v) ? v : [v]).some((x) => x === "on" || x === "true" || x === true));
