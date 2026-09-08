"use client";

import * as React from "react";
import { Check, CircleDashed, PencilLine } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { Checkbox, Progress } from "@/components/ui/controls";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import type { ActionResult } from "@/lib/actions/shared";

/**
 * The checklist for the state a record is currently in.
 *
 * Two kinds of item, saved differently on purpose.
 *
 * A plain item is a tick and nothing else, so the box saves itself. What it
 * posts is **not** the new value — it is an instruction to toggle, and the
 * server decides the result from what is stored. That matters: the checkbox
 * mirrors itself into a form field only on render, so a form submitted from
 * inside the change handler carries the value the box had *before* the click.
 * The tick appears, the server is told nothing changed, and the next render
 * puts it back. Sending an instruction rather than a value removes the race
 * instead of trying to win it.
 *
 * An item the SOP marked as needing evidence gets a text box and an explicit
 * save, because the finding is the point and a tick alone would record only
 * that somebody looked. That path posts the value directly — by the time the
 * save button is pressed the rendered state is current, so there is no race.
 */

export type ChecklistRow = {
  key: string;
  label: string;
  hint?: string;
  requiresNote?: boolean;
  required?: boolean;
  done: boolean;
  note: string | null;
  satisfied: boolean;
};

type ToggleAction = (prev: never, formData: FormData) => Promise<ActionResult>;

export function SopChecklist({
  state,
  items,
  progress,
  action,
}: {
  state: string;
  items: ChecklistRow[];
  progress: number;
  action: ToggleAction;
}) {
  if (items.length === 0) {
    return (
      <p className="text-[12.5px] leading-relaxed text-muted">
        Nothing to tick here — this state is about what happens next, not about preparation.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Progress
          value={progress}
          tone={progress === 100 ? "positive" : "accent"}
          className="flex-1"
        />
        <span className="shrink-0 text-[11.5px] tabular text-faint">{progress}%</span>
      </div>

      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.key}>
            <ChecklistItemRow state={state} item={item} action={action} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChecklistItemRow({
  state,
  item,
  action,
}: {
  state: string;
  item: ChecklistRow;
  action: ToggleAction;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const id = `check-${state}-${item.key}`;

  return (
    <ActionForm action={action}>
      <div
        className={cn(
          "rounded-md border px-3 py-2.5 transition-colors",
          item.satisfied ? "border-positive/25 bg-positive-soft/25" : "border-line bg-elevated",
        )}
      >
        <input type="hidden" name="state" value={state} />
        <input type="hidden" name="key" value={item.key} />
        <input type="hidden" name="mode" value={item.requiresNote ? "set" : "toggle"} />

        <div className="flex items-start gap-2.5">
          <Checkbox
            id={id}
            name={item.requiresNote ? "done" : undefined}
            defaultChecked={item.done}
            className="mt-0.5"
            onCheckedChange={(checked) => {
              if (item.requiresNote) {
                // Ticking is not the record here; the note is. Open it rather
                // than saving a tick the server would refuse anyway.
                setExpanded(checked === true || Boolean(item.note));
                return;
              }
              document.getElementById(id)?.closest("form")?.requestSubmit();
            }}
          />

          <div className="min-w-0 flex-1">
            <label htmlFor={id} className="block text-[13px] leading-snug text-ink">
              {item.label}
              {item.required === false ? (
                <span className="ml-1.5 text-[11px] text-faint">Judgement call</span>
              ) : null}
            </label>
            {item.hint ? (
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-faint">{item.hint}</p>
            ) : null}
            {item.requiresNote && !expanded && item.note ? (
              <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-relaxed text-muted">
                {item.note}
              </p>
            ) : null}
          </div>

          {item.requiresNote ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="shrink-0 rounded p-1 text-faint transition-colors hover:text-muted"
              aria-label={expanded ? "Hide the note" : "Write what you found"}
            >
              <PencilLine className="size-3.5" aria-hidden />
            </button>
          ) : null}

          {item.satisfied ? (
            <Check className="mt-0.5 size-3.5 shrink-0 text-positive" aria-hidden />
          ) : (
            <CircleDashed className="mt-0.5 size-3.5 shrink-0 text-faint" aria-hidden />
          )}
        </div>

        {item.requiresNote ? (
          expanded ? (
            <div className="mt-2.5 space-y-2 pl-[26px]">
              <Textarea
                name="note"
                rows={3}
                defaultValue={item.note ?? ""}
                placeholder="What did you find?"
              />
              <SubmitButton size="sm" variant="secondary">
                Save
              </SubmitButton>
            </div>
          ) : (
            <input type="hidden" name="note" value={item.note ?? ""} />
          )
        ) : null}
      </div>
    </ActionForm>
  );
}
