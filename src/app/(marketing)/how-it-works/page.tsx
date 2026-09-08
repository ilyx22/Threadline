import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PullQuote, Section, SectionIntro, StepMarker } from "@/components/marketing/sections";
import { Reveal } from "@/components/marketing/reveal";
import { StickyCta } from "@/components/marketing/sticky-cta";
import {
  DiagnosisView,
  IdeaEngineView,
  InstallationView,
  IntelligenceBriefView,
  PerformanceView,
} from "@/components/marketing/product-views";

export const metadata: Metadata = {
  title: "How Threadline works",
  description:
    "Diagnose, install, run, improve. A defined installation with a defined handover, and a first intelligence brief inside week one.",
};

const PHASES = [
  {
    index: 1,
    weeks: "Before we start",
    title: "Diagnose",
    body: "We look at where demand is actually constrained, across nine dimensions — positioning, audience, offer alignment, content-market fit, differentiation, creative quality, distribution, conversion path and operations. On five of those nine, publishing more content makes the problem more expensive rather than smaller. You get a written finding either way, including if the finding is that Threadline is not the right answer for you.",
    detail: [
      "Nine dimensions rated from evidence, not impressions",
      "One named primary constraint, with what it costs commercially",
      "A plain answer on whether more content would actually help",
      "A written view on fit, either way",
    ],
    view: <DiagnosisView />,
  },
  {
    index: 2,
    weeks: "Days 1–7",
    title: "Install",
    body: "The part that determines everything downstream, compressed into a week. We capture your context properly — what you sell, who buys it, what they object to, what you believe, how you sound — then load your market and run the first intelligence cycle. By day seven you should be able to see that we understand your market and have already turned that into scripts you can record.",
    detail: [
      "A 60-minute interview capturing beliefs, stories and voice",
      "Your context written up, with real examples of your own sentences",
      "First intelligence brief delivered and 30-day strategy approved",
      "First researched scripts ready, first batch recorded",
    ],
    view: <InstallationView />,
  },
  {
    index: 3,
    weeks: "Every cycle",
    title: "Read the market",
    body: "Each cycle draws on declared sources: named competitors, the creators your buyers follow, notes and transcripts from your own sales calls, the language customers use in reviews and threads, your own published work and your own results. Findings arrive as proposals with the evidence attached, and nothing influences the strategy until you approve it.",
    detail: [
      "Every finding cites the specific item that produced it",
      "You approve, edit or reject — a rejection carries a reason",
      "Approved findings become ranked tests with a defined read",
      "Sources that could not be collected are named, not glossed over",
    ],
    view: <IntelligenceBriefView />,
  },
  {
    index: 4,
    weeks: "Every cycle",
    title: "Make and ship",
    body: "Ideas scored against your offer and your proof, then scripts written in your voice with alternate hooks and filming notes. Every factual claim is flagged, and the system refuses to send a script to the recording queue until a human has verified each one. You record in one batch; production, packaging and publishing happen around you.",
    detail: [
      "Ideas generated from the approved signals, scored and ranked",
      "Scripts with alternate hooks and verified claims",
      "One recording session with an honest time estimate",
      "Editing, packaging and scheduling handled and visible",
    ],
    view: <IdeaEngineView />,
  },
  {
    index: 5,
    weeks: "Every cycle",
    title: "Learn and prove",
    body: "The part most content operations never reach. Performance is broken down by the things you can change, and connected to which pieces produced qualified conversations. Results move the confidence of the signal that caused them, and the month is compared against the baseline we recorded before we started — in language that says what changed, not what we caused.",
    detail: [
      "Results read against the measure each test was set on",
      "Confidence in a finding moves with the evidence, in bounded steps",
      "Baseline and monthly comparison across nine measures",
      "Commercial figures attributed only where a buyer named a piece",
    ],
    view: <PerformanceView />,
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <StickyCta />

      <Section className="pb-8">
        <SectionIntro
          eyebrow="How it works"
          title="Diagnose, install, run, improve."
          lead="A defined installation with a defined handover — not an open-ended retainer that quietly becomes a permanent line in your budget."
        />
      </Section>

      <Section className="pt-0">
        <div className="space-y-20">
          {PHASES.map((phase) => (
            <Reveal key={phase.title}>
              <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <StepMarker index={phase.index} />
                    <span className="text-eyebrow text-faint">{phase.weeks}</span>
                  </div>
                  <h2 className="mt-4 text-[26px] font-medium tracking-tight text-ink">
                    {phase.title}
                  </h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted">{phase.body}</p>
                  <ul className="mt-6 space-y-2.5">
                    {phase.detail.map((item) => (
                      <li key={item} className="flex gap-3 text-[13.5px] leading-relaxed text-muted">
                        <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>{phase.view}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section bordered>
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <PullQuote>
              The engagement has an end date. If it only works while we are in the room, it has not
              worked.
            </PullQuote>
            <p className="mt-8 text-[15px] leading-relaxed text-muted">
              At handover you keep everything: your context, your scripts, your research, your media
              and your reports, along with a written account of how the operation was run.
            </p>
            <ButtonLink
              href="/apply"
              variant="accent"
              size="lg"
              className="mt-10"
              iconRight={ArrowRight}
            >
              Apply for a content growth diagnosis
            </ButtonLink>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
