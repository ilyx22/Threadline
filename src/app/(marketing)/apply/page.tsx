import type { Metadata } from "next";
import { ApplicationForm } from "./application-form";
import { publicBookingUrl } from "@/lib/actions/booking";
import { APPLY } from "@/content/public-site";
import { Eyebrow } from "@/components/public/primitives";
import { Founder, Operator } from "@/components/factory/primitives";

export const metadata: Metadata = {
  title: "Apply for a content growth diagnosis",
  description: "Tell us where demand is actually constrained and how content gets made today. Read by a person, replied to either way.",
  alternates: { canonical: "/apply" },
  robots: { index: true, follow: true },
};

export default async function ApplyPage() {
  const bookingUrl = await publicBookingUrl();

  return (
    <div className="tl-section">
      <div className="tl-container grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <header className="lg:sticky lg:top-24 lg:self-start">
          <Eyebrow>{APPLY.eyebrow}</Eyebrow>
          <h1 className="tl-display max-w-[14ch] text-[clamp(2.25rem,4.6vw,3.75rem)]">{APPLY.title}</h1>
          <p className="tl-lead mt-6 text-[17px]">{APPLY.lead}</p>
          <p className="tl-body mt-4 text-[15px]">{APPLY.reassurance}</p>
          <p className="mt-5 text-[13.5px] text-[color:var(--ink-faint)]">{APPLY.meta}</p>
          <div className="mt-8 hidden items-end gap-3 lg:flex" aria-hidden>
            <Founder className="w-[64px]" />
            <Operator className="w-[64px]" />
          </div>
        </header>

        <div className="tl-card p-5 sm:p-8">
          <ApplicationForm bookingUrl={bookingUrl} />
        </div>
      </div>
    </div>
  );
}
