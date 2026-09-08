"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minus,
  Monitor,
  Pause,
  Play,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge, Pill } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/input";
import { Kbd } from "@/components/ui/data";
import { Notice } from "@/components/ui/feedback";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { ScriptQaBadge } from "@/components/ui/status";
import { toast } from "@/components/ui/toast";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { duration, minutes, pluralise } from "@/lib/utils/format";
import { PLATFORM_META, metaOf } from "@/lib/domain/enums";
import { markRecordedAction, uploadContentAssetAction } from "@/lib/actions/content";
import { sendToRecordingAction } from "@/lib/actions/scripts";

type QueueItem = {
  id: string;
  title: string;
  hook: string;
  altHooks: string[];
  body: string;
  cta: string;
  filmingNotes: string;
  estimatedSeconds: number;
  platform: string;
  scriptType: string;
  pillar: string | null;
  priorityScore: number;
  qaState: string;
  unverifiedClaims: number;
};

/**
 * Recording Room.
 *
 * The founder's screen. Everything else in the product exists to make this list
 * short, correct and ready — so this screen does one thing: show what to record
 * and let them record it.
 */
export function RecordingRoom({
  slug,
  canComplete,
  canUpload,
  estimateMinutes,
  ready,
  notReady,
  awaitingFootage,
}: {
  slug: string;
  canComplete: boolean;
  canUpload: boolean;
  estimateMinutes: number;
  ready: QueueItem[];
  notReady: { id: string; title: string; qaState: string; unverifiedClaims: number }[];
  awaitingFootage: { id: string; title: string; recordedAt: string | null; assetCount: number }[];
}) {
  const [teleprompter, setTeleprompter] = React.useState<number | null>(null);
  const [uploadFor, setUploadFor] = React.useState<{ id: string; title: string } | null>(null);
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  const sendToEditing = (contentItemId: string) => {
    startTransition(async () => {
      const result = await markRecordedAction(slug, contentItemId);
      if (result.ok) {
        toast.success(result.message ?? "Sent to editing.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const sendToProduction = (scriptId: string) => {
    startTransition(async () => {
      const result = await sendToRecordingAction(slug, scriptId);
      if (result.ok) {
        toast.success("Added to production. Upload the footage when you have it.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Recording Room</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Everything approved and waiting for you. Work down the list, or open the teleprompter
            and record the batch in one sitting.
          </p>
        </div>

        {ready.length > 0 ? (
          <div className="shrink-0 rounded-lg border border-accent-line bg-accent-soft px-4 py-3">
            <p className="text-[19px] font-medium tabular text-accent">
              {pluralise(ready.length, "piece")}
            </p>
            <p className="mt-0.5 text-[12px] text-muted">
              Estimated recording time: {minutes(estimateMinutes)}
            </p>
            <p className="mt-1 text-[11px] text-ghost">Includes setup and retakes.</p>
          </div>
        ) : null}
      </header>

      {ready.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="accent" icon={Monitor} onClick={() => setTeleprompter(0)}>
            Open teleprompter
          </Button>
          <span className="text-[12px] text-faint">
            Records the batch in order, starting with the highest priority.
          </span>
        </div>
      ) : null}

      {/* ------------------------------- Ready queue ------------------------------- */}
      {ready.length > 0 ? (
        <ul className="space-y-3">
          {ready.map((item, index) => (
            <li key={item.id}>
              <Card>
                <CardBody className="pt-4">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] tabular text-ghost">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <Pill>{metaOf(PLATFORM_META, item.platform).label}</Pill>
                        <Pill>{item.scriptType.replace(/_/g, " ")}</Pill>
                        <Pill>{duration(item.estimatedSeconds)}</Pill>
                        {item.pillar ? <Pill>{item.pillar}</Pill> : null}
                      </div>
                      <h2 className="mt-2 text-[15px] font-medium leading-snug text-ink">
                        {item.title}
                      </h2>
                      <p className="mt-2 border-l-2 border-accent-line pl-3 text-[14px] leading-relaxed text-muted">
                        {item.hook}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        icon={Monitor}
                        onClick={() => setTeleprompter(index)}
                      >
                        Teleprompter
                      </Button>
                      {canComplete ? (
                        <Button
                          variant="accent"
                          icon={Check}
                          loading={pending}
                          onClick={() => sendToProduction(item.id)}
                        >
                          Recorded
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {item.filmingNotes ? (
                    <div className="mt-4 rounded-md border border-line bg-surface p-3.5">
                      <p className="text-eyebrow mb-1.5 text-faint">How to deliver it</p>
                      <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-muted">
                        {item.filmingNotes}
                      </p>
                    </div>
                  ) : null}

                  {item.cta ? (
                    <p className="mt-3 text-[12.5px] text-accent">
                      <span className="text-faint">Close with: </span>
                      {item.cta}
                    </p>
                  ) : null}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}

      {/* ------------------------------ Awaiting footage --------------------------- */}
      {awaitingFootage.length > 0 ? (
        <Card>
          <CardHeader
            title="Recorded — waiting on footage"
            eyebrow="In production"
            description="Marked as recorded. Upload the raw file so editing can start."
          />
          <CardBody className="pt-0">
            <ul className="divide-y divide-line">
              {awaitingFootage.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <Link
                    href={`/app/${slug}/production/${item.id}`}
                    className="min-w-0 flex-1 truncate text-[13px] text-ink transition-colors hover:text-accent"
                  >
                    {item.title}
                  </Link>
                  {item.assetCount > 0 ? (
                    <Badge tone="positive">
                      {item.assetCount} file{item.assetCount === 1 ? "" : "s"}
                    </Badge>
                  ) : (
                    <Badge tone="warning">No footage yet</Badge>
                  )}
                  {canUpload ? (
                    <Button
                      size="xs"
                      variant="ghost"
                      icon={Upload}
                      onClick={() => setUploadFor({ id: item.id, title: item.title })}
                    >
                      Upload
                    </Button>
                  ) : null}
                  {canComplete && item.assetCount > 0 ? (
                    <Button
                      size="xs"
                      variant="secondary"
                      icon={Check}
                      loading={pending}
                      onClick={() => sendToEditing(item.id)}
                    >
                      Send to editing
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}

      {/* ------------------------------- Not yet ready ----------------------------- */}
      {notReady.length > 0 ? (
        <Card>
          <CardHeader
            title="Not ready yet"
            eyebrow="Backlog"
            description="These are scripted but have not cleared review."
          />
          <CardBody className="pt-0">
            <ul className="divide-y divide-line">
              {notReady.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <Link
                    href={`/app/${slug}/create/scripts/${item.id}`}
                    className="min-w-0 flex-1 truncate text-[13px] text-muted transition-colors hover:text-accent"
                  >
                    {item.title}
                  </Link>
                  {item.unverifiedClaims > 0 ? (
                    <Badge tone="warning" icon={AlertTriangle}>
                      {item.unverifiedClaims} to verify
                    </Badge>
                  ) : null}
                  <ScriptQaBadge state={item.qaState} />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}

      {teleprompter != null && ready[teleprompter] ? (
        <Teleprompter
          items={ready}
          index={teleprompter}
          onIndexChange={setTeleprompter}
          onClose={() => setTeleprompter(null)}
          onComplete={canComplete ? sendToProduction : undefined}
        />
      ) : null}

      <Dialog open={Boolean(uploadFor)} onOpenChange={(open) => !open && setUploadFor(null)}>
        <DialogContent>
          <DialogHeader
            title="Upload raw footage"
            description={uploadFor?.title}
          />
          {uploadFor ? (
            <ActionForm
              action={uploadContentAssetAction.bind(null, slug, uploadFor.id)}
              onSuccess={() => {
                setUploadFor(null);
                router.refresh();
              }}
              className="contents"
            >
              {({ error }) => (
                <>
                  <DialogBody className="space-y-4">
                    <FormError error={error} />
                    <input type="hidden" name="category" value="raw_media" />
                    <Field label="File" htmlFor="rawFile" hint="Video, audio or image. Up to 512MB.">
                      <input
                        id="rawFile"
                        name="file"
                        type="file"
                        required
                        accept="video/*,audio/*,image/*"
                        className="block w-full text-[13px] text-muted file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-raised file:px-3 file:py-1.5 file:text-[12.5px] file:text-ink hover:file:bg-[#242b32]"
                      />
                    </Field>
                    <Notice tone="neutral">
                      Large files upload directly to this server. If your footage lives in Drive or
                      Dropbox, add the link from the Library instead.
                    </Notice>
                  </DialogBody>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setUploadFor(null)}>
                      Cancel
                    </Button>
                    <SubmitButton variant="primary" icon={Upload} pendingLabel="Uploading…">
                      Upload
                    </SubmitButton>
                  </DialogFooter>
                </>
              )}
            </ActionForm>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------- Teleprompter ------------------------------ */

const SPEEDS = [0.4, 0.6, 0.8, 1, 1.3, 1.6, 2];

function Teleprompter({
  items,
  index,
  onIndexChange,
  onClose,
  onComplete,
}: {
  items: QueueItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onComplete?: (scriptId: string) => void;
}) {
  const item = items[index]!;
  const [fontSize, setFontSize] = React.useState(34);
  const [speedIndex, setSpeedIndex] = React.useState(3);
  const [scrolling, setScrolling] = React.useState(false);
  const [activeParagraph, setActiveParagraph] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const frameRef = React.useRef<number | null>(null);
  const remainderRef = React.useRef(0);

  const paragraphs = React.useMemo(
    () => [item.hook, ...item.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean), item.cta].filter(Boolean),
    [item],
  );

  // Persist reading preferences for the session — a founder sets these once.
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("tl.teleprompter");
      if (stored) {
        const parsed = JSON.parse(stored) as { fontSize?: number; speedIndex?: number };
        if (typeof parsed.fontSize === "number") setFontSize(parsed.fontSize);
        if (typeof parsed.speedIndex === "number") setSpeedIndex(parsed.speedIndex);
      }
    } catch {
      /* storage may be unavailable */
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem("tl.teleprompter", JSON.stringify({ fontSize, speedIndex }));
    } catch {
      /* ignore */
    }
  }, [fontSize, speedIndex]);

  // Smooth sub-pixel scrolling: accumulate the fraction so slow speeds still move.
  React.useEffect(() => {
    if (!scrolling) return;
    let last = performance.now();

    const step = (now: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const dt = now - last;
      last = now;
      const pxPerSecond = 26 * SPEEDS[speedIndex]!;
      remainderRef.current += (pxPerSecond * dt) / 1000;
      const whole = Math.floor(remainderRef.current);
      if (whole > 0) {
        el.scrollTop += whole;
        remainderRef.current -= whole;
      }
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        setScrolling(false);
        return;
      }
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [scrolling, speedIndex]);

  // Highlight whichever paragraph sits closest to the reading line.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const readingLine = el.scrollTop + el.clientHeight * 0.35;
      const nodes = Array.from(el.querySelectorAll<HTMLElement>("[data-paragraph]"));
      let best = 0;
      for (const [i, node] of nodes.entries()) {
        if (node.offsetTop <= readingLine) best = i;
      }
      setActiveParagraph(best);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [index]);

  const reset = React.useCallback(() => {
    setScrolling(false);
    remainderRef.current = 0;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setActiveParagraph(0);
  }, []);

  React.useEffect(() => {
    reset();
  }, [index, reset]);

  const goPrev = React.useCallback(() => {
    if (index > 0) onIndexChange(index - 1);
  }, [index, onIndexChange]);

  const goNext = React.useCallback(() => {
    if (index < items.length - 1) onIndexChange(index + 1);
  }, [index, items.length, onIndexChange]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.code === "Space") {
        e.preventDefault();
        setScrolling((v) => !v);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSpeedIndex((i) => Math.min(i + 1, SPEEDS.length - 1));
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSpeedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "r" || e.key === "R") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goNext, goPrev, reset]);

  const requestFullscreen = () => {
    const el = document.getElementById("teleprompter-root");
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  return (
    <div
      id="teleprompter-root"
      className="fixed inset-0 z-[130] flex flex-col bg-base"
      role="dialog"
      aria-label="Teleprompter"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <span className="text-eyebrow text-faint">
          {index + 1} / {items.length}
        </span>
        <p className="min-w-0 flex-1 truncate text-[13px] text-ink">{item.title}</p>
        <Pill>{duration(item.estimatedSeconds)}</Pill>
        <IconButton icon={Maximize2} label="Toggle full screen" onClick={requestFullscreen} />
        <IconButton icon={X} label="Close teleprompter" onClick={onClose} />
      </div>

      {/* Reading area */}
      <div className="relative min-h-0 flex-1">
        {/* Reading line */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-[35%] z-10 border-t border-accent/25"
          aria-hidden
        />
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto scroll-smooth px-6 py-[35vh] sm:px-12"
        >
          <div className="mx-auto max-w-3xl">
            {paragraphs.map((paragraph, i) => (
              <p
                key={i}
                data-paragraph={i}
                className={cn(
                  "mb-8 leading-[1.55] transition-colors duration-300",
                  i === activeParagraph ? "text-ink" : "text-ghost",
                  i === 0 && "font-medium",
                )}
                style={{ fontSize: `${fontSize}px` }}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="border-t border-line bg-surface px-4 py-3">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant={scrolling ? "secondary" : "accent"}
              icon={scrolling ? Pause : Play}
              onClick={() => setScrolling((v) => !v)}
            >
              {scrolling ? "Pause" : "Scroll"}
            </Button>
            <Button variant="ghost" size="sm" onClick={reset}>
              Restart
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11.5px] text-faint">Speed</span>
            <IconButton
              icon={Minus}
              label="Slower"
              size="xs"
              onClick={() => setSpeedIndex((i) => Math.max(i - 1, 0))}
            />
            <span className="w-9 text-center text-[12px] tabular text-ink">
              {SPEEDS[speedIndex]}x
            </span>
            <IconButton
              icon={Plus}
              label="Faster"
              size="xs"
              onClick={() => setSpeedIndex((i) => Math.min(i + 1, SPEEDS.length - 1))}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11.5px] text-faint">Text</span>
            <IconButton
              icon={Minus}
              label="Smaller text"
              size="xs"
              onClick={() => setFontSize((s) => Math.max(18, s - 3))}
            />
            <span className="w-9 text-center text-[12px] tabular text-ink">{fontSize}</span>
            <IconButton
              icon={Plus}
              label="Larger text"
              size="xs"
              onClick={() => setFontSize((s) => Math.min(80, s + 3))}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <IconButton
              icon={ChevronLeft}
              label="Previous script"
              size="sm"
              disabled={index === 0}
              onClick={goPrev}
            />
            <IconButton
              icon={ChevronRight}
              label="Next script"
              size="sm"
              disabled={index === items.length - 1}
              onClick={goNext}
            />
            {onComplete ? (
              <Button
                variant="accent"
                icon={Check}
                onClick={() => {
                  onComplete(item.id);
                  if (index < items.length - 1) goNext();
                  else onClose();
                }}
              >
                Recorded
              </Button>
            ) : null}
          </div>

          <div className="hidden w-full items-center gap-4 text-[11px] text-ghost lg:flex">
            <span className="flex items-center gap-1.5">
              <Kbd>space</Kbd> start / pause
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> speed
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>←</Kbd>
              <Kbd>→</Kbd> change script
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>R</Kbd> restart
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>esc</Kbd> exit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Batch-size selector, used when a founder wants to record a subset. */
export function BatchPicker({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  max: number;
}) {
  return (
    <Field label="Batch size" htmlFor="batchSize">
      <NativeSelect
        id="batchSize"
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {pluralise(n, "piece")}
          </option>
        ))}
      </NativeSelect>
    </Field>
  );
}
