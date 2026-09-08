import type { Metadata } from "next";
import { ArrowRight, Check, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { PullQuote, Section, SectionIntro } from "@/components/marketing/sections";
import { Reveal } from "@/components/marketing/reveal";
import { StickyCta } from "@/components/marketing/sticky-cta";

export const metadata: Metadata = {
  title: "Who Threadline is for",
  description:
    "Established B2B consultants, specialist agencies and expert-led service firms with a proven offer, meaningful customer lifetime value and capacity for more qualified demand.",
};

/**
 * The initial ICP, stated precisely.
 *
 * Narrow on purpose: the engagement only works where a handful of extra
 * qualified conversations changes the year, which requires a proven offer at
 * real value and the capacity to service more of it.
 */

const FITS = [
  {
    title: "Established B2B consultants",
    body: "Your expertise is the product. Content that shows how you think is what makes someone decide to talk to you rather than a competitor with a similar page.",
  },
  {
    title: "Specialist agencies",
    body: "You win on a specific capability rather than on doing everything. The market cannot tell that yet, and that is a positioning problem content can genuinely solve.",
  },
  {
    title: "Expert-led service firms",
    body: "Long consideration, few buyers, high deal value. One well-argued piece reaching the right forty people beats reaching forty thousand of the wrong ones.",
  },
  {
    title: "A proven offer at roughly \u00a35,000 and up",
    body: "Clients already buy it at that value. We are amplifying something that works rather than testing whether an untested offer might.",
  },
  {
    title: "Meaningful customer lifetime value",
    body: "When one engagement is worth five figures or repeats, a handful of extra qualified conversations changes the year. That is what makes the arithmetic work.",
  },
  {
    title: "Capacity to take more demand",
    body: "Generating qualified conversations you cannot service is an expensive way to annoy people. There has to be room to say yes.",
  },
];

const NOT_FITS = [
  {
    title: "Anyone optimising for views",
    body: "We measure content against qualified conversations. If reach is the goal, a volume agency will serve you better and cost less.",
  },
  {
    title: "Founders who will not be on camera",
    body: "The system is built around the founder's face, voice and judgment. Without those, it has nothing to work with.",
  },
  {
    title: "Businesses without a defined offer",
    body: "Content that does not point at anything produces audience, not customers. Fix the offer first.",
  },
  {
    title: "Deal values below roughly \u00a35,000",
    body: "The arithmetic stops working. The volume needed to justify the engagement is not what this system is built to produce.",
  },
  {
    title: "Businesses already at capacity",
    body: "If you could not take three more clients this quarter, demand is not your constraint and we would be selling you the wrong thing.",
  },
  {
    title: "Anyone wanting guaranteed outcomes",
    body: "We will not promise reach, leads or revenue. If a guarantee is a requirement, we are not the right supplier.",
  },
  {
    title: "Large enterprises",
    body: "If you already have a content department, you need coordination software, not an installed operating system.",
  },
];

export default function WhoItsForPage() {
  return (
    <>
      <StickyCta />

      <Section className="pb-8">
        <SectionIntro
          eyebrow="Who it is for"
          title="Expert-led B2B businesses with something proven to sell."
          lead="Threadline is narrow on purpose. The system is good because it is built for a specific situation, and it stops being good the moment it tries to be for everyone."
        />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FITS.map((item, i) => (
            <Reveal key={item.title} delay={i * 50}>
              <Card className="h-full">
                <CardBody className="pt-5">
                  <span className="mb-4 grid size-8 place-items-center rounded-md border border-accent-line bg-accent-soft">
                    <Check className="size-4 text-accent" aria-hidden />
                  </span>
                  <h3 className="text-[15px] font-medium text-ink">{item.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{item.body}</p>
                </CardBody>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section bordered>
        <SectionIntro
          eyebrow="And who it is not for"
          title="We would rather decline than take your money."
          lead="A poor-fit client wastes their budget and our capacity. These are the situations where we will tell you on the call."
        />

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {NOT_FITS.map((item) => (
            <Card key={item.title} className="border-line">
              <CardBody className="pt-5">
                <span className="mb-4 grid size-8 place-items-center rounded-md border border-line bg-surface">
                  <X className="size-4 text-faint" aria-hidden />
                </span>
                <h3 className="text-[15px] font-medium text-muted">{item.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-faint">{item.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </Section>

      <Section bordered>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <PullQuote>
            The test is simple: if your best customer had never encountered you personally, would
            they still have bought?
          </PullQuote>
          <div>
            <p className="text-[15px] leading-relaxed text-muted">
              If the honest answer is no — if your expertise, your opinions or your credibility are
              genuinely part of why people choose you — then content is not marketing overhead for
              your business. It is how people decide you are worth calling, and it deserves to be
              made properly.
            </p>
            <p className="mt-5 text-[15px] leading-relaxed text-muted">
              We are also open about where we are. Expert-led B2B is the category we work in, and
              within it we take on one kind of business at a time while we learn which problem we
              solve best. If you sit outside that focus right now, we will say so rather than take
              the work and improvise.
            </p>
            <ButtonLink href="/apply" variant="accent" size="lg" className="mt-8" iconRight={ArrowRight}>
              Apply for a content growth diagnosis
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
