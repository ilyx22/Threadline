import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hero } from "@/content/marketing-v5";
import { HeroArt } from "@/components/marketing-v5/art/HeroArt";
import { HeroCutaway, HeroTypographic } from "@/components/marketing-v5/art/HeroExplorations";
import { ProblemArt } from "@/components/marketing-v5/art/ProblemArt";
import { WorkshopArt } from "@/components/marketing-v5/art/WorkshopArt";
import { Artefact, Crate, Folder, Knot, Person, Plate, Signal, Spool, Thread, C } from "@/components/marketing-v5/art/kit";

export const metadata: Metadata = { title: "Design lab", robots: { index: false, follow: false } };

const KINDS = ["post", "video", "doc", "proof", "deep", "diagnostic", "nurture", "update"] as const;

/**
 * Internal only — the object families and three representative scenes, plus
 * the three hero explorations from Phase D. Never served in production
 * (`notFound()` below) and disallowed in robots.ts.
 */
export default function DesignLab() {
  if (process.env.NODE_ENV === "production") notFound();
  const H = ({ children }: { children: string }) => (
    <h2 className="v5-h3" style={{ margin: "56px 0 16px" }}>
      {children}
    </h2>
  );
  return (
    <div className="v5-wrap" style={{ padding: "48px var(--v5-gutter) 120px" }}>
      <p className="v5-eyebrow">Design lab · not public</p>
      <h1 className="v5-h2">The Threadline world, in parts.</h1>

      <H>Palette</H>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
        {["ink", "navy", "night", "paper", "paper-deep", "white", "sky", "sky-deep", "mint", "mint-deep", "coral", "coral-deep", "lilac", "lilac-deep", "butter", "gold", "gold-deep", "wood"].map((t) => (
          <div key={t} style={{ border: "2px solid var(--v5-ink)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ height: 56, background: `var(--v5-${t})` }} />
            <p className="v5-tag" style={{ padding: 8 }}>{t}</p>
          </div>
        ))}
      </div>

      <H>People</H>
      <svg viewBox="0 0 1200 200" className="v5-art" style={{ background: "var(--v5-sky)", borderRadius: 20 }}>
        {[C.lilac, C.sky, C.wood, C.paperDeep, C.paper, C.lilac].map((tone, i) => (
          <Person key={i} x={100 + i * 150} y={190} shirt={tone} armR={[30, -60 - i * 16]} />
        ))}
        <Person x={1020} y={190} sit shirt={C.paper} />
        <Person x={1140} y={190} shirt={C.sky} apron={C.gold} armR={[36, -120]} />
      </svg>

      <H>Artefacts, props, the thread</H>
      <svg viewBox="0 0 1200 220" className="v5-art" style={{ background: "var(--v5-paper-deep)", borderRadius: 20 }}>
        {KINDS.map((k, i) => (
          <Artefact key={k} kind={k} x={70 + i * 110} y={70} />
        ))}
        <Thread d="M20 170 Q300 130 600 170 T1180 170" />
        <Knot x={300} y={150} />
        <Knot x={900} y={170} />
        <Spool x={980} y={100} s={0.8} label="ROOT THESIS" />
        <Signal x={1100} y={70} label="REPLY" />
        <Crate x={1000} y={215} w={110} h={40} label="METHOD" />
        <Folder x={1130} y={215} label="CALLS" s={0.7} />
        <Plate x={140} y={200} tone={C.white}>A PLATE</Plate>
      </svg>

      <H>Hero A — the pegged line (chosen)</H>
      <div style={{ background: "var(--v5-sky)", borderRadius: 24, padding: "24px 0 0" }}>
        <HeroArt />
      </div>
      <H>Hero B — the cutaway</H>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center", background: "var(--v5-sky)", borderRadius: 24, padding: 32 }}>
        <div>
          <p className="v5-eyebrow">{hero.eyebrow}</p>
          <h2 className="v5-h1">{hero.headline}</h2>
        </div>
        <div style={{ maxWidth: 520 }}>
          <HeroCutaway />
        </div>
      </div>
      <H>Hero C — the line through the words</H>
      <div style={{ background: "var(--v5-paper)", border: "2px solid var(--v5-ink)", borderRadius: 24, padding: 32 }}>
        <HeroTypographic headline={hero.headline} />
      </div>

      <H>Scene — the vault</H>
      <ProblemArt />
      <H>Scene — the workshop, station 3</H>
      <WorkshopArt station={2} interactive={false} />
      <H>Phone layouts</H>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 400px)", gap: 40 }}>
        <div style={{ background: "var(--v5-sky)", borderRadius: 24 }}>
          <HeroArt layout="tall" />
        </div>
        <ProblemArt layout="tall" />
      </div>
    </div>
  );
}
