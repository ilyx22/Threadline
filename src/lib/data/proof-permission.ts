import "server-only";
import { prisma } from "@/lib/db/client";
import type { ProofPermissionView } from "@/components/app/proof-permissions";

export async function proofPermissionView(orgId: string): Promise<ProofPermissionView> {
  const p = await prisma.proofPermission.findUnique({ where: { orgId } });
  const flags: Record<string, boolean> = {};
  for (const k of ["allowInterview", "allowInternalUse", "allowTestimonial", "allowPublicTestimonial", "allowNamedCaseStudy", "allowAnonCaseStudy", "allowPublishMetrics", "allowLogo"] as const) flags[k] = p?.[k] ?? false;
  return {
    interviewWillingness: p?.interviewWillingness ?? "unknown",
    successConfirmedAt: p?.successConfirmedAt?.toISOString() ?? null,
    successNote: p?.successNote ?? null,
    requestedAt: p?.requestedAt?.toISOString() ?? null,
    grantedAt: p?.grantedAt?.toISOString() ?? null,
    grantedNote: p?.grantedNote ?? null,
    flags,
  };
}

/** Whether asking for a testimonial is appropriate right now — and if not, why. */
export function testimonialGate(view: ProofPermissionView): { appropriate: boolean; reason: string } {
  if (!view.successConfirmedAt) return { appropriate: false, reason: "No positive outcome has been confirmed by an operator." };
  if (view.interviewWillingness === "no") return { appropriate: false, reason: "The client said no." };
  if (view.interviewWillingness === "unknown") return { appropriate: false, reason: "Willingness has not been asked." };
  if (view.requestedAt) return { appropriate: false, reason: `Already requested on ${new Date(view.requestedAt).toLocaleDateString("en-GB")}.` };
  return { appropriate: true, reason: "A positive outcome is confirmed and the client is open to it." };
}
