"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/forms/action-form";
import { requestExportAction } from "@/lib/actions/exports";

type Row = { id: string; status: string; createdAt: string; expiresAt: string | null; downloadPath: string | null; sizeBytes: number | null };

/** FILE-06: request a copy of the workspace's records; downloads last seven days. */
export function ExportCard({ slug, rows }: { slug: string; rows: Row[] }) {
  const router = useRouter();
  return (
    <div className="space-y-3 text-[12.5px] text-muted">
      <p>A JSON copy of everything recorded for this workspace: Brand Brain, ideas, scripts, content, approvals, reports, invoices, pipeline and time. Files are listed; download them from the library.</p>
      <ActionButton size="sm" action={() => requestExportAction(slug)} onDone={() => router.refresh()}>
        Prepare an export
      </ActionButton>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.id}>
            {new Date(r.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
            {r.status === "ready" && r.downloadPath ? (
              <a className="text-accent hover:underline" href={`/api/files/${r.downloadPath}`}>
                Download{r.sizeBytes ? ` (${Math.max(1, Math.round(r.sizeBytes / 1024))} KB)` : ""}
              </a>
            ) : (
              r.status
            )}
            {r.status === "ready" && r.expiresAt ? ` · until ${new Date(r.expiresAt).toLocaleDateString("en-GB")}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
