import { WorkflowError } from "./workflow";

/**
 * The synthetic workspace.
 *
 * Threadline runs one dry run before its first real client: a real company used
 * as a public-information reference, treated as an imaginary client, put through
 * the actual fulfilment path. The purpose is to find out what the delivery
 * system is missing — the SOP gaps, the coordination burden, the QA load, the
 * real Delivery Load — before a paying client discovers them.
 *
 * The danger is entirely about what happens to the output afterwards. A polished
 * synthetic result is indistinguishable from a real one once it has been
 * screenshotted, and "we ran this for a company like yours" is a sentence that
 * would be a lie. So the marker is structural rather than a convention:
 *
 *   - `Organization.synthetic` is a column, not a naming pattern;
 *   - portfolio and revenue aggregates exclude it;
 *   - proof and case-study surfaces refuse it outright;
 *   - it is labelled everywhere it is visible.
 *
 * It is deliberately NOT a separate `kind`. The whole point is that it runs
 * through the same code as a real client, and a different kind would route it
 * around exactly the paths the dry run exists to exercise.
 */

export const SYNTHETIC_LABEL = "Synthetic — not a client";

export const SYNTHETIC_EXPLANATION =
  "A dry run against a real company used as a public reference, put through the real system to find out what delivery is missing. Nothing here describes a client, a result, or anything that happened commercially.";

/** Prisma filter for anything that must count only real clients. */
export const REAL_CLIENTS_ONLY = { synthetic: false } as const;

/**
 * Refuse to use synthetic material as proof.
 *
 * Called at the boundary of anything outward-facing: case studies, testimonials,
 * public proof, portfolio revenue. The error text is written for the person who
 * hits it, because the person who hits it will be in a hurry and looking for
 * something to show a prospect.
 */
export function assertNotSyntheticProof(
  org: { synthetic: boolean; name: string },
  use = "proof",
) {
  if (org.synthetic) {
    throw new WorkflowError(
      `${org.name} is a synthetic dry run, so it cannot be used as ${use}. Nothing in it describes a real client or a real result, and presenting it as one would be a false claim about the business.`,
    );
  }
}

/** How a synthetic figure must be described wherever it is shown. */
export function syntheticCaveat(value: string): string {
  return `${value} — synthetic, unvalidated`;
}
