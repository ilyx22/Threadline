"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { importMetricsCsvAction, type CsvImportSummary } from "@/lib/actions/performance";

/** INT-05: bring platform numbers in from a CSV export; preview first, then import. */
export function CsvImport({ slug }: { slug: string }) {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [summary, setSummary] = React.useState<CsvImportSummary | null>(null);
  const [pending, startTransition] = React.useTransition();
  const run = (mode: "preview" | "import") =>
    startTransition(async () => {
      if (!file) return;
      const fd = new FormData();
      fd.set("file", file);
      fd.set("mode", mode);
      const r = await importMetricsCsvAction(slug, null, fd);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setSummary(r.data);
      toast.success(r.message ?? "Done.");
      if (mode === "import") router.refresh();
    });

  return (
    <Card>
      <CardHeader title="Import numbers from a CSV" description="Export post analytics from the platform, then preview how the rows match your published posts before anything is saved." />
      <CardBody className="space-y-3 pt-0">
        <input
          type="file"
          accept=".csv,text/csv"
          aria-label="CSV file"
          className="block text-[13px] text-muted"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setSummary(null);
          }}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" disabled={!file || pending} onClick={() => run("preview")}>
            Preview
          </Button>
          <Button size="sm" variant="primary" icon={Upload} disabled={!file || pending || !summary || summary.mode !== "preview" || summary.matched === 0} onClick={() => run("import")}>
            Import {summary?.mode === "preview" ? `${summary.matched} row(s)` : ""}
          </Button>
        </div>
        {summary ? (
          <div className="space-y-1 text-[12.5px] text-muted">
            <p>
              {summary.rows} row(s) · columns used: {summary.mapped.join(", ") || "none"}
              {summary.ignored.length ? ` · ignored: ${summary.ignored.join(", ")}` : ""}
            </p>
            <p>
              {summary.matched} matched{summary.mode === "import" ? ` · ${summary.created} imported · ${summary.duplicates} already imported` : ""} · {summary.unmatched.length} unmatched
            </p>
            {summary.unmatched.slice(0, 5).map((u) => (
              <p key={u} className="text-ghost">{u}</p>
            ))}
            {summary.problems.slice(0, 5).map((u) => (
              <p key={u} className="text-negative">{u}</p>
            ))}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
