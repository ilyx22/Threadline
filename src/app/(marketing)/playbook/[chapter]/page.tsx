import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PLAYBOOK } from "@/content/public-site";
import { Eyebrow, PublicButton, Section, Stamp } from "@/components/public/primitives";
import { ChapterArt } from "../chapter-art";
import { ChapterReveal } from "./chapter-reveal";

export function generateStaticParams() {
  return PLAYBOOK.chapters.map((c) => ({ chapter: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ chapter: string }> }): Promise<Metadata> {
  const { chapter } = await params;
  const ch = PLAYBOOK.chapters.find((c) => c.slug === chapter);
  if (!ch) return { title: "Playbook" };
  return { title: `${ch.title} — The Founder Authority System`, description: ch.summary, alternates: { canonical: `/playbook/${ch.slug}` } };
}

/**
 * One chapter, one idea: a heading you can read from across the room, a
 * short explanation, a factory scene, an interactive reveal, and a thing to
 * do today. Then the next chapter. The last chapter hands over to Apply.
 */
export default async function ChapterPage({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter } = await params;
  const index = PLAYBOOK.chapters.findIndex((c) => c.slug === chapter);
  if (index === -1) notFound();
  const ch = PLAYBOOK.chapters[index];
  const prev = PLAYBOOK.chapters[index - 1];
  const next = PLAYBOOK.chapters[index + 1];
  const progress = ((index + 1) / PLAYBOOK.chapters.length) * 100;

  return (
    <article>
      <div className="tl-container pt-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/playbook" className="inline-flex min-h-11 items-center gap-1.5 text-[14px] text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]">
            <ArrowLeft className="size-4" aria-hidden />
            The Founder Authority System
          </Link>
          <span className="tl-label text-[color:var(--ink-faint)]">
            {index + 1} / {PLAYBOOK.chapters.length}
          </span>
        </div>
        <div className="mt-3 h-[6px] overflow-hidden rounded-full border-[1.5px] border-[color:var(--ink)] bg-[color:var(--paper)]" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Reading progress">
          <div className="h-full bg-[color:var(--accent)] transition-[width] duration-700" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <section className="tl-section pb-8 pt-10">
        <div className="tl-container grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
          <div>
            <Eyebrow>Chapter {String(index + 1).padStart(2, "0")}</Eyebrow>
            <h1 className="tl-display max-w-[14ch]">{ch.title}</h1>
            <p className="tl-lead mt-6">{ch.summary}</p>
          </div>
          <div className="tl-card flex items-center justify-center p-6 sm:p-10">
            <ChapterArt scene={ch.scene} large className="w-full max-w-[420px]" />
          </div>
        </div>
      </section>

      <Section band className="pt-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="tl-card p-6 sm:p-8">
            <p className="tl-label text-[color:var(--accent-deep)]">The idea</p>
            <p className="mt-4 text-[clamp(1.125rem,1.5vw,1.375rem)] leading-relaxed text-[color:var(--ink)]">{ch.keyIdea}</p>
          </div>
          <ChapterReveal prompt={ch.reveal.prompt} answer={ch.reveal.answer} />
        </div>
        <div className="tl-card-quiet mt-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:p-8">
          <Stamp className="shrink-0 self-start">Do this</Stamp>
          <p className="tl-body text-[16px] text-[color:var(--ink)]">{ch.practice}</p>
        </div>
      </Section>

      <Section>
        <nav aria-label="Chapters" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {prev ? (
            <PublicButton href={`/playbook/${prev.slug}`}>
              <ArrowLeft className="size-4" aria-hidden />
              {prev.title}
            </PublicButton>
          ) : (
            <span />
          )}
          {next ? (
            <PublicButton href={`/playbook/${next.slug}`} primary>
              {next.title}
              <ArrowRight className="size-4" aria-hidden />
            </PublicButton>
          ) : (
            <PublicButton href="/apply" primary size="lg">
              {PLAYBOOK.closing.title}
              <ArrowRight className="size-5" aria-hidden />
            </PublicButton>
          )}
        </nav>
      </Section>
    </article>
  );
}
