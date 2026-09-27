/**
 * Proof permission keys and their plain-language labels. Kept out of the
 * "use server" actions file: Next.js allows only async functions to be
 * exported from one, and exporting this object there broke every action on the
 * pages that load it in production (found 27 Sept 2026).
 */
export const PERMISSION_KEYS = ["allowInterview", "allowInternalUse", "allowTestimonial", "allowPublicTestimonial", "allowNamedCaseStudy", "allowAnonCaseStudy", "allowPublishMetrics", "allowLogo"] as const;

export const PROOF_PERMISSION_LABELS: Record<(typeof PERMISSION_KEYS)[number], string> = {
  allowInterview: "Take part in a success interview",
  allowInternalUse: "Threadline may use the outcome internally (calibration, training)",
  allowTestimonial: "A written testimonial, shown privately to prospects",
  allowPublicTestimonial: "A public testimonial on Threadline's website",
  allowNamedCaseStudy: "A named case study",
  allowAnonCaseStudy: "An anonymised case study",
  allowPublishMetrics: "Publish specific numbers",
  allowLogo: "Show the company logo",
};
