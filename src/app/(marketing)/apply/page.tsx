import type { Metadata } from "next";
import { ApplicationForm } from "./application-form";
import { publicBookingUrl } from "@/lib/actions/booking";
import { APPLY } from "@/content/public-site";

export const metadata: Metadata = {
  title: "Apply for a diagnosis, not a pitch",
  description: "Tell us where demand is actually constrained and how content gets made today. Read by a person, replied to either way.",
  alternates: { canonical: "/apply" },
  robots: { index: true, follow: true },
};

/** The application, in the homepage's system: the statement beside the form, inside one white panel. The form itself is unchanged. */
export default async function ApplyPage() {
  const bookingUrl = await publicBookingUrl();
  return (
    <div className="v9-home ap-page">
      <section className="v9-hero" aria-labelledby="ap-title">
        <div className="v9-panel ap-panel">
          <header className="ap-head">
            <p className="v9-eyebrow">{APPLY.eyebrow}</p>
            <h1 id="ap-title" className="v9-h1">
              {APPLY.title}
            </h1>
            <p className="v9-lead">{APPLY.lead}</p>
            <p className="v9-body">{APPLY.reassurance}</p>
            <p className="v9-note">{APPLY.meta}</p>
          </header>
          <div className="ap-form v9-tile is-paper">
            <ApplicationForm bookingUrl={bookingUrl} />
          </div>
        </div>
      </section>
    </div>
  );
}
