import { parseStringArray } from "@/lib/db/json";
import { WorkflowError } from "./workflow";
import type { Format } from "./enums";

/**
 * Long-form pilot.
 *
 * YouTube long-form is a pilot, not part of the base retainer. It is a
 * different production shape — a different orientation, a different length, a
 * title and thumbnail that carry most of the outcome — and pricing it as though
 * it were another short is how an engagement quietly loses money.
 *
 * So the product supports long-form fully, and the *entitlement* is explicit:
 * a client has it only when the `long_form` module is enabled on their
 * organisation. Everywhere it appears without that, it is labelled PILOT.
 *
 * This module deliberately contains no upload path. Publishing to YouTube needs
 * a verified OAuth consent screen we do not have; a person uploads and records
 * the URL, exactly as with every other platform.
 */

export const LONG_FORM_MODULE = "long_form";

/** Formats that are long-form. Everything else is treated as short. */
const LONG_FORM_FORMATS: readonly string[] = ["long_form", "interview", "documentary"];

export function isLongForm(format: string): boolean {
  return LONG_FORM_FORMATS.includes(format);
}

export type Orientation = "vertical" | "horizontal";

export const ORIENTATION_META: Record<Orientation, { label: string; ratio: string }> = {
  vertical: { label: "Vertical", ratio: "9:16" },
  horizontal: { label: "Horizontal", ratio: "16:9" },
};

/**
 * Orientation is derived from format rather than stored.
 *
 * A stored orientation is a second source of truth that can disagree with the
 * format, and there is no case where a long-form piece is shot vertically for
 * this product.
 */
export function orientationFor(format: string): Orientation {
  return isLongForm(format) ? "horizontal" : "vertical";
}

export function aspectRatioFor(format: string): string {
  return ORIENTATION_META[orientationFor(format)].ratio;
}

/* ------------------------------- Entitlement ------------------------------- */

export function longFormEnabled(modulesEnabled: string | null | undefined): boolean {
  return parseStringArray(modulesEnabled).includes(LONG_FORM_MODULE);
}

export type ScopeLabel = { label: string; tone: "accent" | "outline"; note: string };

/**
 * How long-form is described in an operator or admin context.
 *
 * Never silently included. An operator looking at a client should be able to
 * tell in one glance whether long-form is in scope for them.
 */
export function longFormScope(modulesEnabled: string | null | undefined): ScopeLabel {
  return longFormEnabled(modulesEnabled)
    ? {
        label: "Long-form enabled",
        tone: "accent",
        note: "This client has long-form in scope. Capacity and pricing were agreed separately from the base retainer.",
      }
    : {
        label: "Pilot / custom",
        tone: "outline",
        note: "Long-form is not part of this client's retainer. Enable it only against an agreed pilot or a custom scope — it is a different production shape, not another short.",
      };
}

/**
 * Guard the creation of long-form work.
 *
 * The refusal is the point: without it, a well-meaning operator adds one
 * long-form piece "just this once", and the retainer silently acquires a
 * commitment nobody priced.
 */
export function assertLongFormAllowed(
  format: string,
  modulesEnabled: string | null | undefined,
  orgName = "This client",
) {
  if (!isLongForm(format)) return;
  if (longFormEnabled(modulesEnabled)) return;
  throw new WorkflowError(
    `${orgName} does not have long-form in scope. Long-form is a pilot with its own capacity and pricing — enable the module on the client record first, deliberately, rather than adding it to the retainer by accident.`,
  );
}

/* ------------------------------- Packaging -------------------------------- */

export type PackagingField = {
  key: "workingTitle" | "title" | "thumbnailRef" | "description" | "ctaOptions";
  label: string;
  hint: string;
  /** Required before the package can be approved. */
  required: boolean;
};

/**
 * What a long-form package needs before it can be approved.
 *
 * Title and thumbnail carry most of the outcome on a long-form piece, so both
 * are required. Short-form packaging keeps the existing lighter requirements.
 */
export const LONG_FORM_PACKAGING: PackagingField[] = [
  {
    key: "workingTitle",
    label: "Working title",
    hint: "What the piece is called while it is being made. Carries it through production.",
    required: false,
  },
  {
    key: "title",
    label: "Final title",
    hint: "Decided once the edit exists, against what the piece actually turned out to be.",
    required: true,
  },
  {
    key: "thumbnailRef",
    label: "Thumbnail",
    hint: "An uploaded asset or a link to the chosen frame. Required — on long-form this does more work than the title.",
    required: true,
  },
  {
    key: "description",
    label: "Description and CTA",
    hint: "Description copy plus the next step for a viewer who wants one.",
    required: true,
  },
];

export type PackageState = {
  workingTitle?: string | null;
  title?: string | null;
  thumbnailRef?: string | null;
  description?: string | null;
};

/** Fields still missing before a long-form package can be approved. */
export function missingPackagingFields(pkg: PackageState): PackagingField[] {
  return LONG_FORM_PACKAGING.filter((field) => {
    if (!field.required) return false;
    const value = pkg[field.key as keyof PackageState];
    return !value || !String(value).trim();
  });
}

/**
 * Guard package approval.
 *
 * A long-form package approved without a title or a thumbnail is a package that
 * will be finished at upload time by whoever happens to be doing it, which is
 * exactly the improvisation the operating loop exists to remove.
 */
export function assertPackageApprovable(format: string, pkg: PackageState) {
  if (!isLongForm(format)) return;
  const missing = missingPackagingFields(pkg);
  if (missing.length === 0) return;
  throw new WorkflowError(
    `${missing.map((f) => f.label).join(", ")} ${missing.length === 1 ? "is" : "are"} still missing. On long-form, the title and thumbnail do more work than the edit — approving without them means somebody improvises at upload time.`,
  );
}

/** Formats offered when long-form is out of scope. */
export function availableFormats(modulesEnabled: string | null | undefined): Format[] {
  const all: Format[] = [
    "short_form",
    "talking_head",
    "carousel",
    "text_post",
    "screen_share",
    "long_form",
    "interview",
    "documentary",
  ];
  if (longFormEnabled(modulesEnabled)) return all;
  return all.filter((f) => !isLongForm(f));
}
