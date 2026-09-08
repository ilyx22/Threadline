"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Play, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button, IconButton } from "@/components/ui/button";
import { ThreadMark } from "@/components/brand/logo";

/**
 * Demo tour.
 *
 * A nine-stop narrative for sales calls. Deliberately NOT a product-onboarding
 * coach-mark overlay: it is a discreet floating card that moves the presenter
 * through the operating loop in order, with a line about what each screen
 * removes from the founder's week. It never blocks the UI, and it exits cleanly.
 */

export type TourStop = {
  title: string;
  narrative: string;
  href: string;
};

export function buildTour(slug: string): TourStop[] {
  const base = `/app/${slug}`;
  return [
    {
      title: "The command centre",
      narrative:
        "Monday morning. The founder opens one screen and sees exactly three things: what to record, what to approve, and what to decide. Everything else is handled around them.",
      href: base,
    },
    {
      title: "The Brand Brain",
      narrative:
        "This is why the output sounds like them. Company, offer, customer, beliefs, voice and proof — captured once during installation, then used by every generation the system runs.",
      href: `${base}/intelligence`,
    },
    {
      title: "Market Radar",
      narrative:
        "Competitor content, customer language, recurring questions and objections. Tagged and searchable, so an idea can always be traced back to the evidence that justified it.",
      href: `${base}/intelligence/radar`,
    },
    {
      title: "Signals",
      narrative:
        "Research alone is not valuable. The system turns research and performance into outliers, patterns, hypotheses and tests — each with evidence, a confidence level and a next experiment.",
      href: `${base}/intelligence/signals`,
    },
    {
      title: "The idea engine",
      narrative:
        "Ideas scored on relevance, novelty, proof strength and format fit, then ranked. The founder shortlists rather than stares at a blank page.",
      href: `${base}/create`,
    },
    {
      title: "The script engine",
      narrative:
        "Full scripts with alternate hooks, filming notes and version history. Any statement a reasonable person could challenge is flagged as a claim — and the system refuses to mark a script ready to record until a human has verified every one.",
      href: `${base}/create/scripts`,
    },
    {
      title: "The Recording Room",
      narrative:
        "The founder's screen. Today's queue, an estimated batch time, and a teleprompter. They record the things only they can record, then close the laptop.",
      href: `${base}/production/recording`,
    },
    {
      title: "The production board",
      narrative:
        "Raw through to live. Editors assigned, revisions structured with a reason attached, approvals recorded with a timestamp. No chat thread required to know where anything is.",
      href: `${base}/production`,
    },
    {
      title: "Performance and the loop closing",
      narrative:
        "What worked, by topic, format, hook and CTA — and which pieces produced qualified conversations. Those learnings write back into Signals, which feed the next cycle of ideas. That is the operating system.",
      href: `${base}/performance`,
    },
  ];
}

const STORAGE_KEY = "tl.tour.step";

export function DemoTour({ slug }: { slug: string }) {
  const router = useRouter();
  // Built client-side: buildTour lives in this client module, so a Server
  // Component cannot call it.
  const stops = React.useMemo(() => buildTour(slug), [slug]);
  const [active, setActive] = React.useState(false);
  const [step, setStep] = React.useState(0);

  // Restore an in-progress tour across navigations within the session.
  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored != null) {
        const index = Number(stored);
        if (Number.isInteger(index) && index >= 0 && index < stops.length) {
          setStep(index);
          setActive(true);
        }
      }
    } catch {
      /* storage can be unavailable */
    }
  }, [stops.length]);

  const persist = (index: number | null) => {
    try {
      if (index == null) sessionStorage.removeItem(STORAGE_KEY);
      else sessionStorage.setItem(STORAGE_KEY, String(index));
    } catch {
      /* ignore */
    }
  };

  const start = () => {
    setStep(0);
    setActive(true);
    persist(0);
    router.push(stops[0]!.href);
  };

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, stops.length - 1));
    setStep(clamped);
    persist(clamped);
    router.push(stops[clamped]!.href);
  };

  const exit = () => {
    setActive(false);
    persist(null);
  };

  React.useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit();
      if (e.key === "ArrowRight" && step < stops.length - 1) goTo(step + 1);
      if (e.key === "ArrowLeft" && step > 0) goTo(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step, stops.length]);

  if (!active) {
    return (
      <Button
        variant="ghost"
        size="sm"
        icon={Play}
        onClick={start}
        className="hidden md:inline-flex"
        title="Guided walkthrough for demonstrations"
      >
        Demo tour
      </Button>
    );
  }

  const current = stops[step]!;
  const isLast = step === stops.length - 1;

  return (
    <>
      <Button variant="ghost" size="sm" icon={Play} onClick={exit} className="hidden md:inline-flex">
        Exit tour
      </Button>

      <div
        role="region"
        aria-label="Demo tour"
        className="fixed bottom-4 right-4 z-[70] w-[min(24rem,calc(100vw-2rem))] animate-rise sm:bottom-6 sm:right-6"
      >
        <div className="overflow-hidden rounded-xl border border-accent-line bg-elevated shadow-pop">
          <div className="flex items-center gap-2.5 border-b border-line px-4 py-2.5">
            <ThreadMark size={16} className="text-accent" />
            <span className="text-eyebrow flex-1 text-faint">
              Tour · {step + 1} of {stops.length}
            </span>
            <IconButton icon={X} label="Exit tour" size="xs" onClick={exit} />
          </div>

          <div className="px-4 py-3.5">
            <p className="text-[14px] font-medium text-ink">{current.title}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">{current.narrative}</p>
          </div>

          <div className="flex items-center gap-2 border-t border-line px-4 py-2.5">
            <div className="flex flex-1 items-center gap-1" aria-hidden>
              {stops.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to stop ${i + 1}`}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i === step ? "bg-accent" : i < step ? "bg-accent/35" : "bg-raised",
                  )}
                />
              ))}
            </div>
            <IconButton
              icon={ArrowLeft}
              label="Previous stop"
              size="xs"
              disabled={step === 0}
              onClick={() => goTo(step - 1)}
            />
            {isLast ? (
              <Button size="xs" variant="accent" onClick={exit}>
                Finish
              </Button>
            ) : (
              <Button size="xs" variant="secondary" iconRight={ArrowRight} onClick={() => goTo(step + 1)}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
