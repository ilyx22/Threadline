import * as React from "react";
import { PLAYBOOK } from "@/content/public-site";
import { LANGUAGE_SOURCES, PROMISES, RAW_MATERIAL } from "@/content/playbook";
import Bench from "@/components/marketing-v5/Bench";
import { Drawers, EvidenceLadder, ExpectationCard, FlipGrid, MemoryScrubber, RoomPicker, SentenceBuilder, Sorter } from "./Widgets";
import { MarkRead } from "./Progress";

const TONES = ["is-sky", "is-peach", "is-mint", "is-lilac", "is-butter", "is-sky", "is-peach", "is-mint", "is-lilac", "is-butter"];

/** The thing to do in each chapter, by slug. Chapter nine runs the learning bench itself. */
function Widget({ slug }: { slug: string }) {
  switch (slug) {
    case "expertise-is-the-raw-material":
      return <FlipGrid items={RAW_MATERIAL} hint="Tap a crate to see what is inside." />;
    case "positioning-is-a-decision":
      return <SentenceBuilder />;
    case "listen-before-you-speak":
      return <Drawers items={LANGUAGE_SOURCES} hint="Open each drawer. The language is already there." />;
    case "one-thesis-many-expressions":
      return <Sorter />;
    case "distribution-is-a-place-not-a-blast":
      return <RoomPicker />;
    case "repeated-exposure-builds-memory":
      return <MemoryScrubber />;
    case "measure-what-the-buyer-did":
      return <EvidenceLadder />;
    case "write-down-what-you-expect":
      return <ExpectationCard />;
    case "change-one-thing-and-retest":
      return <Bench />;
    case "what-we-do-not-promise":
      return <FlipGrid items={PROMISES} hint="Flip each card. Three cannot be promised; three can." />;
    default:
      return null;
  }
}

/**
 * One chapter of the Playbook: a numbered heading, the idea, the card to
 * turn, the thing to do today, and the interactive object that makes the
 * idea usable. Rendered inline on /playbook and on its own at /playbook/[slug].
 */
export function Chapter({ index, standalone = false }: { index: number; standalone?: boolean }) {
  const ch = PLAYBOOK.chapters[index];
  const n = String(index + 1).padStart(2, "0");
  const wide = ch.slug === "change-one-thing-and-retest";
  return (
    <section id={`chapter-${index + 1}`} className={`pb-chapter${wide ? " is-wide" : ""}`} data-scene aria-labelledby={`pb-h-${index + 1}`}>
      <div className="v9-wrap">
        <header className="pb-chapter-head v9-reveal">
          <p className="v9-eyebrow">
            Chapter {n} of {PLAYBOOK.chapters.length}
          </p>
          {standalone ? (
            <h1 id={`pb-h-${index + 1}`} className="v9-h1">
              {ch.title}
            </h1>
          ) : (
            <h2 id={`pb-h-${index + 1}`} className="v9-h2">
              {ch.title}
            </h2>
          )}
          <p className="v9-lead">{ch.summary}</p>
        </header>
        <div className="pb-chapter-grid">
          <div className="pb-chapter-copy v9-reveal">
            <div className="pb-idea">
              <p className="v9-tag">The idea</p>
              <p>{ch.keyIdea}</p>
            </div>
            <details className="pb-turn">
              <summary>
                <span className="v9-tag">Turn the card</span>
                <strong>{ch.reveal.prompt}</strong>
                <i aria-hidden="true">+</i>
              </summary>
              <p>{ch.reveal.answer}</p>
            </details>
            <div className="pb-do">
              <p className="v9-tag">Do this today</p>
              <p>{ch.practice}</p>
            </div>
            <MarkRead slug={ch.slug} />
          </div>
          <div className={`pb-chapter-tool v9-tile ${TONES[index]} v9-reveal`} style={{ ["--d" as string]: "120ms" }}>
            <Widget slug={ch.slug} />
          </div>
        </div>
      </div>
    </section>
  );
}
