"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/forms/action-form";
import { confirmBrainSectionAction } from "@/lib/actions/brain-versions";

const LABEL: Record<string, string> = { company: "Company", founder: "Founder", voice: "Voice", contentRules: "Content rules" };

/** CX-04: sections Threadline filled in from what you supplied, waiting for you to confirm. */
export function PrefillConfirm({ slug, sections, canConfirm }: { slug: string; sections: string[]; canConfirm: boolean }) {
  const router = useRouter();
  if (!sections.length) return null;
  return (
    <section className="space-y-2 rounded-md border border-line bg-surface p-4 text-[12.5px]" aria-labelledby="prefill-h">
      <h2 id="prefill-h" className="text-[13px] font-medium text-ink">
        Filled in by Threadline, waiting for your confirmation
      </h2>
      <p className="text-muted">We wrote these from what you gave us. Check them below; confirm each one when it is right, or edit it (an edit counts as confirmation).</p>
      <div className="flex flex-wrap gap-2">
        {sections.map((s) =>
          canConfirm ? (
            <ActionButton key={s} size="sm" action={() => confirmBrainSectionAction(slug, s)} onDone={() => router.refresh()}>
              Confirm {LABEL[s] ?? s}
            </ActionButton>
          ) : (
            <span key={s} className="rounded border border-line px-2 py-1 text-muted">
              {LABEL[s] ?? s}
            </span>
          ),
        )}
      </div>
    </section>
  );
}
