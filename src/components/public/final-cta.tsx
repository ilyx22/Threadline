import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { OutputTile, Token } from "@/components/factory/objects";
import { Lead, PublicButton, Title } from "@/components/public/primitives";

/** The close: expertise goes in, four outputs come out, one action. */
export function FinalCta({ title, lead, outputs, action }: { title: string; lead: string; outputs: readonly string[]; action: { label: string; href: string } }) {
  const tones = ["ember", "paper", "signal", "stamp"] as const;
  return (
    <div className="tl-card p-8 sm:p-12">
      <div className="tl-final">
        <div>
          <Title as="h2">{title}</Title>
          <Lead>{lead}</Lead>
          <div className="mt-8">
            <PublicButton href={action.href} primary size="lg">
              {action.label}
              <ArrowRight className="size-5" aria-hidden />
            </PublicButton>
          </div>
        </div>
        <Reveal>
          <div className="tl-final-in">
            <Token label="Your expertise" tone="ember" />
            <span className="tl-label">goes in</span>
          </div>
          <div className="tl-final-outputs">
            {outputs.map((o, i) => (
              <OutputTile key={o} label={o} tone={tones[i % tones.length]} style={{ ["--i" as string]: i }} />
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
