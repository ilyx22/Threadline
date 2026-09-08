"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ClipboardPaste, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Notice } from "@/components/ui/feedback";
import { ActionButton, ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { toast } from "@/components/ui/toast";
import {
  addExampleAction,
  analyseExampleAction,
  bulkCaptureAction,
  deleteExampleAction,
  fillMetricsAction,
  judgeExampleAction,
  rateExampleAction,
  runCalibrationAction,
} from "@/lib/actions/corpus";
import type { BulkCaptureResult } from "@/lib/actions/corpus";
import { BULK_CAPTURE_LIMIT } from "@/lib/domain/corpus";
import type { ActionResult } from "@/lib/actions/shared";

type AddExample = (prev: never, formData: FormData) => Promise<ActionResult<{ id: string }>>;

const PLATFORMS = ["YouTube", "YouTube Shorts", "TikTok", "Instagram", "LinkedIn", "X", "Other"];

const FORMATS: { value: string; label: string }[] = [
  { value: "unknown", label: "Not set" },
  { value: "short_video", label: "Short video" },
  { value: "long_video", label: "Long video" },
  { value: "carousel", label: "Carousel" },
  { value: "text_post", label: "Text post" },
  { value: "newsletter", label: "Newsletter" },
  { value: "podcast", label: "Podcast" },
];

const BUYER: { value: string; label: string }[] = [
  { value: "unrated", label: "Unrated" },
  { value: "direct", label: "Our buyer" },
  { value: "adjacent", label: "Adjacent" },
  { value: "off_icp", label: "Not our buyer" },
];

const INTENT: { value: string; label: string }[] = [
  { value: "unrated", label: "Unrated" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed", label: "Mixed" },
  { value: "entertainment", label: "Entertainment" },
];

/**
 * Adding one example by hand.
 *
 * The URL is required and unique. An example with no source is an anecdote with
 * a view count attached, and the corpus is only worth anything if every row can
 * be traced back to something real.
 *
 * The follower field carries more weight than it looks: without it a piece
 * cannot be read against the audience the creator already had, which is the
 * difference between "the algorithm chose this" and "their subscribers watched
 * it".
 */
export function AddExampleButton({ wedges }: { wedges: { id: string; label: string }[] }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <Button icon={Plus} onClick={() => setOpen(true)}>
        Add example
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader
            title="Add a corpus example"
            description="Real content from the wedge's market. Include ordinary pieces from creators already here, not only their hits — without a baseline nothing can be called an outlier."
          />
          <ActionForm
            action={addExampleAction as AddExample}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
            className="contents"
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />

                  <Field label="URL" htmlFor="url" error={fieldErrors.url}>
                    <Input id="url" name="url" required autoFocus placeholder="https://…" />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Title" htmlFor="title" error={fieldErrors.title}>
                      <Input id="title" name="title" required />
                    </Field>
                    <Field label="Platform" htmlFor="platform">
                      <NativeSelect id="platform" name="platform" defaultValue="LinkedIn">
                        {PLATFORMS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field
                      label="Format"
                      htmlFor="format"
                      hint="Comparisons are drawn within a format first."
                    >
                      <NativeSelect id="format" name="format" defaultValue="unknown">
                        {FORMATS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label="Audience" htmlFor="buyerRelevance" optional>
                      <NativeSelect id="buyerRelevance" name="buyerRelevance" defaultValue="unrated">
                        {BUYER.map((b) => (
                          <option key={b.value} value={b.value}>
                            {b.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label="Intent" htmlFor="commercialIntent" optional>
                      <NativeSelect
                        id="commercialIntent"
                        name="commercialIntent"
                        defaultValue="unrated"
                      >
                        {INTENT.map((i) => (
                          <option key={i.value} value={i.value}>
                            {i.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Creator handle" htmlFor="creatorHandle" error={fieldErrors.creatorHandle}>
                      <Input id="creatorHandle" name="creatorHandle" required placeholder="@handle" />
                    </Field>
                    <Field label="Creator name" htmlFor="creatorName" optional>
                      <Input id="creatorName" name="creatorName" />
                    </Field>
                    <Field label="Published" htmlFor="publishedAt" optional>
                      <Input id="publishedAt" name="publishedAt" type="date" />
                    </Field>
                  </div>

                  <Field label="Wedge" htmlFor="wedgeId" optional>
                    <NativeSelect id="wedgeId" name="wedgeId" defaultValue="">
                      <option value="">Not assigned</option>
                      {wedges.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>

                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    <Metric name="views" label="Views" />
                    <Metric name="likes" label="Likes" />
                    <Metric name="comments" label="Comments" />
                    <Metric name="shares" label="Shares" />
                    <Metric name="saves" label="Saves" />
                    <Metric name="followers" label="Followers" />
                  </div>

                  <Field
                    label="Transcript"
                    htmlFor="transcript"
                    optional
                    hint="What the analysis actually reads. Without it the extraction has only the title to go on."
                  >
                    <Textarea id="transcript" name="transcript" rows={5} />
                  </Field>

                  <Field label="Why you kept it" htmlFor="notes" optional>
                    <Textarea id="notes" name="notes" rows={2} />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary">Add</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Metric({ name, label }: { name: string; label: string }) {
  return (
    <Field label={label} htmlFor={name}>
      <Input id={name} name={name} type="number" min={0} defaultValue={0} inputSize="sm" />
    </Field>
  );
}

export function ExampleActions({
  exampleId,
  analysed,
  judged,
}: {
  exampleId: string;
  analysed: boolean;
  judged: boolean;
}) {
  const router = useRouter();
  const refresh = () => router.refresh();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ActionButton
        size="xs"
        variant="ghost"
        action={() => analyseExampleAction(exampleId)}
        onDone={refresh}
      >
        {analysed ? "Re-analyse" : "Analyse"}
      </ActionButton>
      <ActionButton
        size="xs"
        variant="ghost"
        action={() => judgeExampleAction(exampleId)}
        onDone={refresh}
      >
        {judged ? "Re-judge" : "Judge"}
      </ActionButton>
      <ActionButton
        size="xs"
        variant="ghost"
        action={() => deleteExampleAction(exampleId)}
        confirm="Remove this example? It contributes to its creator's baseline, so removing it changes how their other examples are read."
        onDone={refresh}
      >
        Remove
      </ActionButton>
    </div>
  );
}

/**
 * Paste a block of URLs, get rows.
 *
 * This is the workflow that has to survive being used 300 times. It takes
 * whatever shape the links arrive in — one per line, comma separated, buried in
 * prose — and derives everything the URL honestly reveals.
 *
 * It is blunt about what it cannot do, because the alternative is an operator
 * who believes the numbers arrived. No public endpoint returns a view count on
 * any platform in this wedge, so every captured row lands without metrics and
 * says so.
 */
export function BulkCaptureButton() {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [result, setResult] = React.useState<BulkCaptureResult | null>(null);
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  const detected = React.useMemo(
    () => (text.match(/https?:\/\/[^\s,<>"')\]]+/gi) ?? []).length,
    [text],
  );

  const run = () => {
    startTransition(async () => {
      try {
        const outcome = await bulkCaptureAction(text);
        if (!outcome.ok) {
          toast.error(outcome.error);
          return;
        }
        setResult(outcome.data);
        setText("");
        toast.success(outcome.message ?? "Captured.");
        router.refresh();
      } catch {
        toast.error("That capture did not reach the server. Nothing was saved.");
      }
    });
  };

  const close = () => {
    setOpen(false);
    setResult(null);
  };

  return (
    <>
      <Button icon={ClipboardPaste} variant="secondary" onClick={() => setOpen(true)}>
        Paste URLs
      </Button>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent size="lg">
          <DialogHeader
            title="Capture from a list of links"
            description="Paste them in any shape. Platform, format and creator are read from the URL where it honestly says so; titles and text are fetched where the platform allows it."
          />
          <DialogBody className="space-y-4">
            <Notice tone="info" title="The numbers still come from you">
              No public endpoint returns a view count on LinkedIn, TikTok, Instagram, X or YouTube
              without credentials, so every row lands without metrics and is listed as needing
              detail. Nothing is estimated — a guessed view count would flow into the creator
              baseline and corrupt every band computed against it.
            </Notice>

            <Field
              label="Links"
              htmlFor="bulk-urls"
              hint={`Up to ${BULK_CAPTURE_LIMIT} at a time. ${detected} detected.`}
            >
              <Textarea
                id="bulk-urls"
                rows={10}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={"https://www.linkedin.com/posts/...\nhttps://www.youtube.com/watch?v=...\nhttps://someone.substack.com/p/..."}
              />
            </Field>

            {result ? (
              <div className="space-y-2 rounded-md border border-line bg-raised/40 px-3 py-2.5">
                <p className="text-[12.5px] text-ink">
                  {result.added} added · {result.duplicates} already here ·{" "}
                  {result.failed.length} could not be read
                </p>
                {result.notes.map((note) => (
                  <p key={note} className="text-[11.5px] leading-relaxed text-muted">
                    {note}
                  </p>
                ))}
                {result.failed.length > 0 ? (
                  <ul className="space-y-1">
                    {result.failed.slice(0, 8).map((f) => (
                      <li key={f.url} className="text-[11.5px] leading-relaxed text-faint">
                        <span className="text-negative">{f.reason}</span> — {f.url}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>
              {result ? "Done" : "Cancel"}
            </Button>
            <Button
              variant="primary"
              loading={pending}
              disabled={detected === 0}
              onClick={run}
            >
              {pending ? "Capturing" : `Capture ${detected || ""}`.trim()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type FillMetrics = (prev: never, formData: FormData) => Promise<ActionResult<{ id: string }>>;

/**
 * Fill in the half no public endpoint will give us.
 *
 * Opens on a row that has no numbers yet. Deliberately transcription only — no
 * relevance ratings here — because this is the fast mechanical pass and mixing
 * judgement into it produces worse judgement.
 */
export function FillMetricsButton({
  exampleId,
  title,
  creatorHandle,
  needsMetrics,
}: {
  exampleId: string;
  title: string;
  creatorHandle: string;
  needsMetrics: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <Button
        size="xs"
        variant={needsMetrics ? "accent" : "ghost"}
        onClick={() => setOpen(true)}
      >
        {needsMetrics ? "Add numbers" : "Edit numbers"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader
            title="Record what it did"
            description="Read these off the post. They are stored as hand-entered, and the corpus never pretends otherwise."
          />
          <ActionForm
            action={fillMetricsAction as FillMetrics}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
            className="contents"
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <input type="hidden" name="exampleId" value={exampleId} />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Title" htmlFor={`t-${exampleId}`} error={fieldErrors.title}>
                      <Input id={`t-${exampleId}`} name="title" defaultValue={title} />
                    </Field>
                    <Field
                      label="Creator handle"
                      htmlFor={`c-${exampleId}`}
                      error={fieldErrors.creatorHandle}
                      hint="Baselines group on this, so keep it identical across their posts."
                    >
                      <Input
                        id={`c-${exampleId}`}
                        name="creatorHandle"
                        defaultValue={creatorHandle}
                      />
                    </Field>
                  </div>

                  <Field label="Published" htmlFor={`p-${exampleId}`} optional>
                    <Input id={`p-${exampleId}`} name="publishedAt" type="date" />
                  </Field>

                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    <Metric name="views" label="Views" />
                    <Metric name="likes" label="Likes" />
                    <Metric name="comments" label="Comments" />
                    <Metric name="shares" label="Shares" />
                    <Metric name="saves" label="Saves" />
                    <Metric name="followers" label="Followers" />
                  </div>

                  <Field
                    label="Transcript or post text"
                    htmlFor={`x-${exampleId}`}
                    optional
                    hint="What the extraction reads. Without it there is only the title to go on."
                  >
                    <Textarea id={`x-${exampleId}`} name="transcript" rows={6} />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary">Save</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Rate one example without leaving the list.
 *
 * Deliberately three selects and no save button: the corpus is rated in long
 * passes over many rows, and a modal per row would guarantee the job never gets
 * done. Each change saves immediately.
 *
 * The extraction's own opinion is shown as a *suggestion* beside the fields and
 * is never pre-selected. An LLM asked whether content is commercially relevant
 * will find a way to say yes; letting it fill the field would quietly convert a
 * guess into the operator judgement the entire reading depends on.
 */
export function RateControls({
  exampleId,
  format,
  buyerRelevance,
  commercialIntent,
  suggested,
}: {
  exampleId: string;
  format: string;
  buyerRelevance: string;
  commercialIntent: string;
  suggested: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [local, setLocal] = React.useState({ format, buyerRelevance, commercialIntent });

  React.useEffect(() => {
    setLocal({ format, buyerRelevance, commercialIntent });
  }, [format, buyerRelevance, commercialIntent]);

  const save = (next: { format: string; buyerRelevance: string; commercialIntent: string }) => {
    const previous = local;
    setLocal(next);
    startTransition(async () => {
      try {
        const result = await rateExampleAction({ exampleId, ...next });
        if (!result.ok) {
          toast.error(result.error);
          setLocal(previous);
          return;
        }
        router.refresh();
      } catch {
        // Same rule as ActionButton: a rating that silently failed to save is
        // worse than one that visibly did.
        toast.error("That rating did not reach the server. Nothing was saved.");
        setLocal(previous);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-md border border-line bg-raised/30 px-3 py-2.5">
      <RateSelect
        label="Format"
        value={local.format}
        options={FORMATS}
        disabled={pending}
        onChange={(v) => save({ ...local, format: v })}
      />
      <RateSelect
        label="Audience"
        value={local.buyerRelevance}
        options={BUYER}
        disabled={pending}
        onChange={(v) => save({ ...local, buyerRelevance: v })}
      />
      <RateSelect
        label="Intent"
        value={local.commercialIntent}
        options={INTENT}
        disabled={pending}
        onChange={(v) => save({ ...local, commercialIntent: v })}
      />
      {suggested ? (
        <p className="pb-1.5 text-[11px] leading-relaxed text-ghost">
          Extraction suggested <span className="text-faint">{suggested}</span> — your call, not its.
        </p>
      ) : null}
    </div>
  );
}

function RateSelect({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const id = React.useId();
  return (
    <div className="min-w-[9.5rem]">
      <label
        htmlFor={id}
        className="block text-[10.5px] font-medium uppercase tracking-wide text-faint"
      >
        {label}
      </label>
      <NativeSelect
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}

export function RunCalibrationButton() {
  const router = useRouter();
  return (
    <ActionButton
      variant="accent"
      action={() => runCalibrationAction()}
      onDone={() => router.refresh()}
    >
      Run calibration
    </ActionButton>
  );
}
