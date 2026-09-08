import type { Metadata } from "next";
import { ApplicationForm } from "./application-form";
import { publicBookingUrl } from "@/lib/actions/booking";

export const metadata: Metadata = {
  title: "Apply for a content growth diagnosis",
  description:
    "Tell us where demand is actually constrained and how content gets made today. We read every application and reply either way.",
};

export default async function ApplyPage() {
  const bookingUrl = await publicBookingUrl();

  return (
    <div className="relative px-5 py-16 lg:px-8 lg:py-24">
      <div className="hero-vignette pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-2xl">
        <header className="mb-10">
          <p className="text-eyebrow mb-4 text-accent">Founding client programme</p>
          <h1 className="text-hero">Apply for a content growth diagnosis</h1>
          <p className="mt-5 text-[16px] leading-relaxed text-muted">
            This is a diagnostic, not a signup. Your answers are what we use to work out where
            demand is actually constrained in your business — and on five of the nine dimensions we
            look at, more content would make the problem more expensive rather than smaller.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Answer honestly. If the answer is that we are not the right fit, we would both rather
            know now, and you keep the finding either way.
          </p>
          <p className="mt-5 text-[13.5px] text-faint">
            Three short steps, about four minutes. Read by a person, replied to either way.
          </p>
        </header>

        <ApplicationForm bookingUrl={bookingUrl} />
      </div>
    </div>
  );
}
