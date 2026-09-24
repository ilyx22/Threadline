import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PLAYBOOK } from "@/content/public-site";
import Motion from "@/components/marketing-v5/Motion";
import { Chapter } from "@/components/marketing-v9/playbook/Chapter";

export function generateStaticParams() {
  return PLAYBOOK.chapters.map((c) => ({ chapter: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ chapter: string }> }): Promise<Metadata> {
  const { chapter } = await params;
  const ch = PLAYBOOK.chapters.find((c) => c.slug === chapter);
  if (!ch) return { title: "Playbook" };
  return { title: `${ch.title} — The Founder Authority System`, description: ch.summary, alternates: { canonical: `/playbook/${ch.slug}` } };
}

/** One chapter on its own: the same object as on /playbook, with the way back and the way on. */
export default async function ChapterPage({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter } = await params;
  const index = PLAYBOOK.chapters.findIndex((c) => c.slug === chapter);
  if (index === -1) notFound();
  const prev = PLAYBOOK.chapters[index - 1];
  const next = PLAYBOOK.chapters[index + 1];
  return (
    <div className="v9-home pb-page pb-single">
      <Motion />
      <div className="v9-wrap pb-crumbs">
        <Link href="/playbook" className="v9-link">
          ← The Founder Authority System
        </Link>
        <span className="v9-tag">
          {index + 1} / {PLAYBOOK.chapters.length}
        </span>
      </div>
      <Chapter index={index} standalone />
      <nav aria-label="Chapters" className="v9-wrap pb-chapter-nav">
        {prev ? (
          <Link href={`/playbook/${prev.slug}`} className="v9-btn is-ghost">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/playbook/${next.slug}`} className="v9-btn">
            {next.title} →
          </Link>
        ) : (
          <Link href={PLAYBOOK.closing.cta.href} className="v9-btn">
            {PLAYBOOK.closing.title} →
          </Link>
        )}
      </nav>
    </div>
  );
}
