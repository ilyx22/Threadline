import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Brain,
  ClipboardList,
  Handshake,
  MessageSquare,
  Mic,
  Send,
  Sparkles,
  Telescope,
  Video,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/tabs";
import { ThreadMark } from "@/components/brand/logo";
import { PullQuote, Section, SectionIntro } from "@/components/marketing/sections";
import { Reveal } from "@/components/marketing/reveal";
import { StickyCta } from "@/components/marketing/sticky-cta";
import {
  BrandBrainView,
  CommandCentreView,
  DiagnosisView,
  InstallationView,
  IntelligenceBriefView,
  PerformanceView,
  ProductionBoardView,
  RecordingRoomView,
  ScriptEngineView,
} from "@/components/marketing/product-views";

export const metadata: Metadata = {
  title: "Threadline — content people actually want to watch",
  description:
    "You already have the expertise. Threadline turns it into high-quality content that builds authority and qualified demand — and runs the machine around it, so you do not have to.",
};

/**
 * The public site.
 *
 * Information hierarchy, in the order a buyer actually asks:
 *   outcome -> pain -> mechanism -> who does what -> proof of the mechanism ->
 *   what happens first -> whether they fit -> what the product looks like -> apply.
 *
 * The product is sold as a managed outcome. The software is the mechanism and
 * the proof, revealed after the argument has been made, never as the pitch.
 */
export default function MarketingHomePage() {
  return (
    <>
      <StickyCta />

      {/* --------------------------------- Outcome -------------------------------- */}
      <section className="relative overflow-hidden px-5 pb-20 pt-20 lg:px-8 lg:pb-28 lg:pt-32">
        <div className="hero-vignette pointer-events-none absolute inset-0" aria-hidden />
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" aria-hidden />

        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-eyebrow mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-elevated px-3 py-1.5 text-faint">
              <ThreadMark size={13} className="text-accent" />
              Founding client programme
            </p>

            <h1 className="text-display">
              You already have
              <br />
              the expertise.
            </h1>

            <p className="mt-8 max-w-2xl text-[19px] leading-relaxed text-ink lg:text-[21px]">
              We turn it into content people actually want to watch.
            </p>

            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-muted lg:text-[17px]">
              And we run the system around it — research, strategy, scripting, production,
              distribution and learning — so that the content compounds into authority and
              qualified demand, without you running the machine.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <ButtonLink href="/apply" variant="accent" size="lg" iconRight={ArrowRight}>
                Apply for a content growth diagnosis
              </ButtonLink>
            </div>

            <p className="mt-6 text-[13px] text-ghost">
              For established expert-led B2B businesses. A small number of clients at a time.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------- Pain ---------------------------------- */}
      <Section bordered>
        <Reveal>
          <SectionIntro
            eyebrow="Why it stalls"
            title="The expertise is not the problem. The content is."
            lead="You already know things your market would pay to hear. What stops that becoming authority is rarely the knowledge — it is what happens between the knowledge and something worth watching."
          />
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Nobody would choose to watch it",
              body: "The thinking is good. The piece is a talking head reading a list, so the people who would have hired you never get to the part where you say something only you could say.",
            },
            {
              title: "Topics chosen by mood",
              body: "This week's post comes from whatever was on your mind on Sunday, not from anything you know about what your market is trying to solve.",
            },
            {
              title: "Output that stops when you get busy",
              body: "Every piece needs you at four separate points. The moment delivery gets heavy, publishing goes quiet — which is exactly when pipeline matters most.",
            },
            {
              title: "A founder-shaped bottleneck",
              body: "Writing, briefing, chasing, reviewing, reformatting. Most of the hours go to coordination rather than to the part only you can do.",
            },
            {
              title: "No learning loop",
              body: "Nobody can say why one piece produced three conversations and the next produced none, so the same guesses repeat for quarters at a time.",
            },
            {
              title: "Views that never become authority",
              body: "Reach goes up, standing does not. Nothing published makes anyone think you are the obvious person to call, and nothing connects what went out to who eventually enquired.",
            },
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 60}>
              <div className="h-full rounded-lg border border-line bg-elevated p-6">
                <h3 className="text-[15px] font-medium text-ink">{item.title}</h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-10 rounded-xl border border-line bg-elevated p-8 lg:p-10">
            <PullQuote>
              Most experts do not need more content. They need the content they already have the
              material for to be good enough that someone would choose to watch it.
            </PullQuote>
          </div>
        </Reveal>
      </Section>

      {/* -------------------------------- Mechanism -------------------------------- */}
      <Section bordered>
        <Reveal>
          <SectionIntro
            eyebrow="The mechanism"
            title="How the expertise becomes something worth watching."
            lead="Not a toolkit and not a retainer for posts. A defined cycle that starts in your market, ends in a commercial signal, and gets better at both each time round."
          />
        </Reveal>

        <div className="mt-14 space-y-3">
          {[
            {
              step: "Intelligence",
              icon: Telescope,
              body: "We read your market from declared sources: competitors, the creators your buyers follow, your own sales calls, the language customers actually use, and your own results. Every finding keeps the evidence behind it.",
            },
            {
              step: "Strategy",
              icon: Brain,
              body: "We name what is actually limiting demand — which is not always content — and turn approved findings into a ranked set of tests, each with a defined read.",
            },
            {
              step: "Create",
              icon: Sparkles,
              body: "Ideas scored and ranked against your offer and your proof, then scripts written in your voice, with alternate hooks and every factual claim flagged for a human to verify.",
            },
            {
              step: "Record",
              icon: Mic,
              body: "One focused batch. A queue, an estimated time, and a teleprompter. You record the things only you can record, then close the laptop.",
            },
            {
              step: "Produce",
              icon: Video,
              body: "Editors assigned, revisions structured, approvals tracked. A revision request has to carry a reason, because unexplained rejections are the biggest source of wasted edit cycles.",
            },
            {
              step: "Distribute",
              icon: Send,
              body: "Genuinely different packaging per platform, a calendar of what goes out when, and the live URL captured for every piece — which is what makes measurement possible at all.",
            },
            {
              step: "Learn",
              icon: BarChart3,
              body: "What worked, broken down by the things you can change. Which pieces produced qualified conversations. Those results move the confidence of the signal that caused them, so the next cycle is better informed than the last.",
            },
          ].map((stage, i) => (
            <Reveal key={stage.step} delay={i * 50}>
              <div className="group flex gap-5 rounded-lg border border-line bg-elevated p-6 transition-colors hover:border-line-strong lg:gap-8 lg:p-7">
                <div className="flex shrink-0 flex-col items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full border border-line bg-surface">
                    <stage.icon className="size-4 text-accent" aria-hidden />
                  </span>
                  {i < 6 ? (
                    <span className="w-px flex-1 bg-line" aria-hidden />
                  ) : null}
                </div>
                <div className="min-w-0 pb-1">
                  <div className="flex items-baseline gap-3">
                    <span className="text-eyebrow text-ghost">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-[18px] font-medium tracking-tight text-ink">
                      {stage.step}
                    </h3>
                  </div>
                  <p className="mt-2.5 max-w-2xl text-[14.5px] leading-relaxed text-muted">
                    {stage.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* --------------------------- You do / Threadline does ---------------------- */}
      <Section bordered>
        <Reveal>
          <SectionIntro
            eyebrow="The division of labour"
            title="You keep the four things only you can do."
            lead="Everything else is ours. This is the whole trade, stated plainly enough to hold us to."
          />
        </Reveal>

        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-xl border border-accent-line bg-accent-soft p-8 lg:p-10">
              <p className="text-eyebrow mb-7 text-accent">You</p>
              <ul className="space-y-6">
                {[
                  {
                    icon: MessageSquare,
                    label: "Provide context and expertise",
                    body: "The beliefs, the stories, the specifics from real client work. Nobody else has these.",
                  },
                  {
                    icon: Mic,
                    label: "Record in focused batches",
                    body: "One session, a defined queue, an honest estimate of how long it takes.",
                  },
                  {
                    icon: ClipboardList,
                    label: "Approve the decisions that matter",
                    body: "Signals, strategy, scripts and finished pieces. Nothing goes out without you.",
                  },
                  {
                    icon: Handshake,
                    label: "Sell, and tell us what happened",
                    body: "Which conversations were real. That is the feedback that makes the next cycle sharper.",
                  },
                ].map((item) => (
                  <li key={item.label} className="flex gap-4">
                    <item.icon className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                    <div>
                      <p className="text-[15px] font-medium text-ink">{item.label}</p>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="h-full rounded-xl border border-line bg-elevated p-8 lg:p-10">
              <p className="text-eyebrow mb-7 text-faint">Threadline</p>
              <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {[
                  { icon: Telescope, label: "Market research" },
                  { icon: Brain, label: "Positioning and strategy" },
                  { icon: Sparkles, label: "Ideas and scripting" },
                  { icon: Video, label: "Production management" },
                  { icon: Boxes, label: "Per-platform packaging" },
                  { icon: Send, label: "Distribution workflow" },
                  { icon: BarChart3, label: "Measurement" },
                  { icon: ClipboardList, label: "Optimisation" },
                ].map((item) => (
                  <li key={item.label} className="flex items-center gap-3">
                    <item.icon className="size-4 shrink-0 text-faint" aria-hidden />
                    <span className="text-[14px] text-muted">{item.label}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-9 border-t border-line pt-7 text-[13.5px] leading-relaxed text-muted">
                These are stages in one cycle, not separate services. A published piece can be
                traced back to the source that caused it and forward to the conversation it
                produced — which is the only way to tell whether any of it is working.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ----------------------------- Intelligence proof -------------------------- */}
      <Section bordered>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Reveal>
            <div>
              <SectionIntro
                eyebrow="What you actually receive"
                title="A brief, every cycle. Evidence attached."
                lead="Not a report on how much we posted. An account of what is happening in your market, why it matters to your business specifically, and what we are doing because of it."
              />

              <ul className="mt-9 space-y-5">
                {[
                  {
                    title: "Every finding cites its source",
                    body: "A signal that cannot point at the item that produced it does not enter your workspace. That rule is enforced in the software, not just intended.",
                  },
                  {
                    title: "You approve before anything changes",
                    body: "Findings arrive as proposals. Nothing influences your strategy until you have approved, edited or rejected it — and a rejection has to carry a reason.",
                  },
                  {
                    title: "Findings become ranked tests",
                    body: "Each with a defined read, so a result is an answer rather than an opinion. When the numbers come in, they move how much we trust the finding that caused it.",
                  },
                  {
                    title: "What we could not read is stated",
                    body: "Where a platform blocks automated access, the brief says so and names what was done instead. It never implies coverage that did not happen.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex gap-4">
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                      aria-hidden
                    />
                    <div>
                      <p className="text-[15px] font-medium text-ink">{item.title}</p>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="grid gap-4">
              <IntelligenceBriefView />
              <DiagnosisView />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------ Fast first win ----------------------------- */}
      <Section bordered>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
          <Reveal>
            <div>
              <SectionIntro
                eyebrow="The first seven days"
                title="Proof that we understand your market, inside a week."
                lead="Not a discovery phase that disappears for a month. By day seven you should be able to see that we understand your market, and that the understanding has already produced work you can use."
              />

              <ol className="mt-9 space-y-4">
                {[
                  ["01", "Business context captured", "Your offer, customer, positioning, proof and voice, recorded properly. Everything downstream starts from your business rather than a template."],
                  ["02", "Constraint diagnosis complete", "We name what is actually limiting demand across nine dimensions, and say plainly whether more content is the answer."],
                  ["03", "First intelligence brief delivered", "What we found in your market, the evidence behind it, and the tests we want to run."],
                  ["04", "30-day strategy approved", "You see the themes and tests for the next month, and sign them off."],
                  ["05", "First researched scripts ready", "Built from the research, fact-checked, ready to record."],
                  ["06", "First recording completed", "One focused batch. You record; everything after that is ours."],
                  ["07", "First assets in production", "Your footage is with an editor and moving through the board."],
                ].map(([step, title, body]) => (
                  <li key={step} className="flex gap-5">
                    <span className="text-eyebrow mt-1 shrink-0 text-ghost">{step}</span>
                    <div>
                      <p className="text-[15px] font-medium text-ink">{title}</p>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <p className="mt-9 text-[13.5px] leading-relaxed text-muted">
                Each step is marked complete only when the work behind it genuinely exists in your
                workspace — not when someone ticks a box. Where a step is stuck, the reason is
                written down and you can see it.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <InstallationView />
          </Reveal>
        </div>
      </Section>

      {/* --------------------------------- The fit --------------------------------- */}
      <Section bordered>
        <Reveal>
          <SectionIntro
            eyebrow="The fit"
            title="Built for a specific kind of business."
            lead="We say this precisely because taking on a poor-fit client wastes their money and our capacity."
          />
        </Reveal>

        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-xl border border-accent-line bg-accent-soft p-8">
              <p className="text-eyebrow mb-6 text-accent">This works when</p>
              <ul className="space-y-4">
                {[
                  "You are an established B2B consultant, specialist agency or expert-led service firm",
                  "You have a proven offer at roughly £5,000 and up, that clients already buy",
                  "Customer lifetime value is meaningful enough that a handful of conversations changes the year",
                  "There is real content potential — opinions, methods and client work worth publishing",
                  "You have the capacity to take on more qualified demand if it arrives",
                  "The founder will appear, on camera and in writing",
                ].map((item) => (
                  <li key={item} className="flex gap-3.5 text-[14px] leading-relaxed text-muted">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="h-full rounded-xl border border-line bg-elevated p-8">
              <p className="text-eyebrow mb-6 text-faint">This does not work when</p>
              <ul className="space-y-4">
                {[
                  "The goal is views rather than customers",
                  "There is no defined offer yet, or the offer is still changing shape monthly",
                  "The founder will not appear in the work",
                  "You are expecting guaranteed reach, guaranteed leads or guaranteed revenue",
                  "You want someone to post on your behalf without your judgment in the loop",
                  "There is already a full internal content department",
                ].map((item) => (
                  <li key={item} className="flex gap-3.5 text-[14px] leading-relaxed text-faint">
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-line-strong"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-8 border-t border-line pt-6 text-[13.5px] leading-relaxed text-muted">
                If the diagnosis shows Threadline is not the right answer, we will tell you on the
                call. You keep the finding either way.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------- Product proof ----------------------------- */}
      <Section bordered>
        <Reveal>
          <SectionIntro
            eyebrow="The system behind it"
            title="You can see the whole operation."
            lead="The service runs on software we built for it, and you have access to all of it. Not so you have another tool to learn — so nothing about how your content gets made is hidden from you."
          />
        </Reveal>

        <div className="mt-14 space-y-16">
          {[
            {
              title: "Everything the system knows about your business",
              body: "Captured once during installation: your offer, customer, beliefs, voice and proof. This is why the output sounds like you rather than like a category. When drafts start sounding generic, it is almost always because a section here has gone thin — and the product tells you which one.",
              view: <BrandBrainView />,
            },
            {
              title: "Scripts you can record without rewriting",
              body: "Alternate hooks, filming notes and version history. Anything a reasonable person could challenge is flagged as a claim, and the system refuses to send a script to the recording queue until a human has verified every one.",
              view: <ScriptEngineView />,
            },
            {
              title: "Production you can see without chasing",
              body: "Raw through to live, editors assigned, revisions structured, every stage change recorded with who did it and when. You stop having to ask where anything is.",
              view: <ProductionBoardView />,
            },
            {
              title: "Results tied to conversations, not just reach",
              body: "Performance broken down by the things you can change, then which pieces produced qualified conversations. Where a buyer named a specific piece, we record it — and where they did not, we say so rather than guessing.",
              view: <PerformanceView />,
            },
          ].map((item, i) => (
            <Reveal key={item.title}>
              <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
                <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
                  <h3 className="text-[22px] font-medium tracking-tight text-ink">{item.title}</h3>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted">{item.body}</p>
                </div>
                <div className={i % 2 === 1 ? "lg:order-1" : undefined}>{item.view}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <h3 className="text-[22px] font-medium tracking-tight text-ink">
                And one screen that tells you what needs you today
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                Record, approve, decide — with honest time estimates. On most days it is a short
                list. That is the point: your involvement should be small, specific and obviously
                worth it.
              </p>
              <ButtonLink
                href="/how-it-works"
                variant="secondary"
                className="mt-7"
                iconRight={ArrowRight}
              >
                See how the engagement runs
              </ButtonLink>
            </div>
            <div className="grid gap-4">
              <CommandCentreView />
              <RecordingRoomView />
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ---------------------------------- FAQ ------------------------------------ */}
      <Section bordered>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Reveal>
            <SectionIntro eyebrow="Questions" title="The things people actually ask." />
          </Reveal>

          <Reveal delay={80}>
            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  q: "What exactly am I buying?",
                  a: "A managed outcome, not software access. We run market intelligence, positioning and creative strategy, scripting, production management, distribution workflow and measurement. You provide expertise, record in batches, approve the decisions that matter, and tell us which conversations were real. The software exists so you can see all of it; it is the mechanism, not the product.",
                },
                {
                  q: "Do you guarantee results?",
                  a: "No, and you should be sceptical of anyone who does. What we guarantee is that the operation runs, that every recommendation carries the evidence behind it, and that you get an honest account of what happened each period — including the ones where output or results went the wrong way.",
                },
                {
                  q: "How much of my time does this take?",
                  a: "Onboarding is around 25 minutes of forms plus a 60-minute interview. After that: one recording batch and one approval pass per cycle. Everything else is designed to be invisible to you unless something needs a decision.",
                },
                {
                  q: "Will the content sound like me?",
                  a: "That depends almost entirely on one hour of the installation: the interview where we capture your beliefs, your stories and real examples of your own sentences. Clients who do that properly get drafts they can record with light edits. Clients who rush it get output that reads like everyone else, and we will tell you which is happening.",
                },
                {
                  q: "Do you post on my behalf?",
                  a: "We prepare everything and you approve it. In this version we do not publish automatically at all — the platforms require credentials and app approvals only the account owner can obtain, so a piece is published manually and the live URL recorded. The product states that plainly rather than hiding it behind a connect button that does nothing.",
                },
                {
                  q: "What if content is not actually my problem?",
                  a: "Then we should both want to know that before you spend money. The constraint diagnosis rates nine dimensions of the demand problem, and on five of them publishing more makes the issue more expensive rather than smaller. If that is what we find, we will say so — and it is the most useful thing we could tell you.",
                },
                {
                  q: "Who owns the content and the data?",
                  a: "You do. Your context, scripts, research, media and reports are yours. If the engagement ends, you get all of it in an export along with a written handover of how the operation was run.",
                },
                {
                  q: "How many clients do you take?",
                  a: "A small number at a time. This is a founding-phase programme and the installation is hands-on, so capacity is the real constraint on how many we accept.",
                },
              ].map((item, i) => (
                <AccordionItem key={item.q} value={`item-${i}`}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent>{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </Section>

      {/* ---------------------------------- CTA ------------------------------------ */}
      <Section bordered className="relative overflow-hidden">
        <div className="hero-vignette pointer-events-none absolute inset-0" aria-hidden />
        <Reveal>
          <div className="relative mx-auto max-w-2xl text-center">
            <ThreadMark size={36} className="mx-auto mb-8 text-accent" />
            <h2 className="text-section">
              You have the expertise. Let us make it worth watching.
            </h2>
            <p className="mt-6 text-[16px] leading-relaxed text-muted">
              Apply, and we will look at what you already know, what your market is actually trying
              to solve, and whether we can turn the first into content that earns you the second. If
              we can, we will tell you exactly how. If we cannot, we will tell you that too.
            </p>
            <div className="mt-10 flex justify-center">
              <ButtonLink href="/apply" variant="accent" size="lg" iconRight={ArrowRight}>
                Apply for a content growth diagnosis
              </ButtonLink>
            </div>
            <p className="mt-8 text-[12.5px] text-ghost">
              Applications are read by a person. Expect a reply either way.
            </p>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
