"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/forms/action-form";
import { restoreBrainVersionAction } from "@/lib/actions/brain-versions";

type Version = { version: number; changed: string[]; createdAt: string };

/** AI-03/ENG-04: the Brand Brain's history, with restore for editors, and drafts written against older versions. */
export function BrainVersions({ slug, current, versions, stale, canEdit }: { slug: string; current: number; versions: Version[]; stale: { id: string; title: string; writtenAgainst: number }[]; canEdit: boolean }) {
  const router = useRouter();
  return (
    <section className="space-y-3 rounded-md border border-line p-4" aria-labelledby="brain-versions-h">
      <h2 id="brain-versions-h" className="text-[13px] font-medium text-ink">
        Brand Brain version {current}
      </h2>
      {stale.length ? (
        <div className="text-[12.5px] text-muted">
          <p className="text-ink">Drafts written against an older version (check them or generate again):</p>
          <ul className="mt-1 space-y-0.5">
            {stale.map((s) => (
              <li key={s.id}>
                <a href={`/app/${slug}/create/scripts/${s.id}`} className="text-accent hover:underline">
                  {s.title}
                </a>{" "}
                (version {s.writtenAgainst})
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <ul className="divide-y divide-line text-[12.5px] text-muted">
        {versions.map((v) => (
          <li key={v.version} className="flex items-center justify-between gap-2 py-1.5">
            <span>
              <span className="tabular text-ink">v{v.version}</span> · {new Date(v.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} · {v.changed.length ? `changed ${v.changed.join(", ")}` : "first version"}
            </span>
            {canEdit && v.version !== current ? (
              <ActionButton size="xs" variant="ghost" action={() => restoreBrainVersionAction(slug, v.version)} confirm={`Restore version ${v.version}? It becomes a new version; nothing is deleted.`} onDone={() => router.refresh()}>
                Restore
              </ActionButton>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
