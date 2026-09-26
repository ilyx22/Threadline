"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionButton } from "@/components/forms/action-form";
import { toast } from "@/components/ui/toast";
import { activateLessonAction, retireLessonAction } from "@/lib/actions/lessons";

type Lesson = { id: string; text: string; basis: string; status: string; platform: string | null; retiredReason: string | null };
type Worked = { id: string; correction: string };

/** LRN-02: lessons the AI is told to follow, from corrections a retest confirmed. Staff only. */
export function LessonsPanel({ slug, lessons, worked }: { slug: string; lessons: Lesson[]; worked: Worked[] }) {
  const router = useRouter();
  const [text, setText] = React.useState("");
  const [basis, setBasis] = React.useState("");
  const [platform, setPlatform] = React.useState("");
  const [pending, start] = React.useTransition();
  const submit = (input: { text: string; basis?: string; correctionId?: string; platform?: string }) =>
    start(async () => {
      const r = await activateLessonAction(slug, input);
      if (r.ok) {
        toast({ title: r.message ?? "Done." });
        setText("");
        setBasis("");
        router.refresh();
      } else toast({ title: r.error, variant: "error" });
    });
  return (
    <section className="space-y-3 rounded-md border border-line p-4" aria-labelledby="lessons-h">
      <h2 id="lessons-h" className="text-[13px] font-medium text-ink">
        Lessons in generation
      </h2>
      <p className="text-[12.5px] text-muted">Every idea and script generated for this workspace is told to follow the lessons in force. Retire one to take it out; the record stays.</p>
      <ul className="divide-y divide-line text-[12.5px]">
        {lessons.map((l) => (
          <li key={l.id} className="flex items-start justify-between gap-2 py-1.5">
            <span className={l.status === "active" ? "text-ink" : "text-ghost line-through"}>
              {l.text}
              {l.platform ? ` (${l.platform} only)` : ""} <span className="text-ghost">· {l.basis}</span>
              {l.retiredReason ? <span className="text-ghost"> · retired: {l.retiredReason}</span> : null}
            </span>
            {l.status === "active" ? (
              <ActionButton size="xs" variant="ghost" action={() => retireLessonAction(slug, l.id, window.prompt("Why retire it?") ?? "")} onDone={() => router.refresh()}>
                Retire
              </ActionButton>
            ) : null}
          </li>
        ))}
        {!lessons.length ? <li className="py-1.5 text-muted">None yet.</li> : null}
      </ul>
      {worked.length ? (
        <div className="space-y-1 text-[12.5px]">
          <p className="text-muted">Corrections a retest confirmed:</p>
          {worked.map((w) => (
            <div key={w.id} className="flex items-center justify-between gap-2">
              <span className="text-ink">{w.correction}</span>
              <Button size="xs" variant="ghost" disabled={pending} onClick={() => submit({ text: w.correction, correctionId: w.id })}>
                Make it a lesson
              </Button>
            </div>
          ))}
        </div>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_140px_auto]">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="The lesson, as an instruction" aria-label="Lesson" />
        <Input value={basis} onChange={(e) => setBasis(e.target.value)} placeholder="What it is based on" aria-label="Basis" />
        <Input value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Platform (optional)" aria-label="Platform" />
        <Button disabled={pending || !text.trim()} onClick={() => submit({ text, basis, platform: platform.trim() || undefined })}>
          Add
        </Button>
      </div>
    </section>
  );
}
