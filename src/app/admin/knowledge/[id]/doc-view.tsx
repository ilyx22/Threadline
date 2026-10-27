"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive, Eye, History, Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/controls";
import { MarkdownView } from "@/components/ui/markdown";
import { toast } from "@/components/ui/toast";
import { restoreKnowledgeAction, setKnowledgeStatusAction } from "@/lib/actions/knowledge";
import type { ActionResult } from "@/lib/actions/shared";
import { formatDate } from "@/lib/utils/dates";
import { KnowledgeForm } from "../knowledge-form";

/** Read, edit (saves a new version), history (restore any version), archive. */
export function KnowledgeDocView({
  id,
  status,
  currentVersion,
  versions,
  defaults,
}: {
  id: string;
  status: string;
  currentVersion: number;
  versions: { version: number; title: string; createdAt: string }[];
  defaults: { title: string; kind: string; platform: string; summary: string; source: string; body: string };
}) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"read" | "edit" | "history">("read");
  const [pending, startTransition] = React.useTransition();
  const run = (fn: () => Promise<ActionResult<unknown>>) =>
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(r.message ?? "Done.");
        router.refresh();
      } else toast.error(r.error);
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          value={mode}
          onValueChange={setMode}
          size="sm"
          options={[
            { value: "read", label: "Read", icon: Eye },
            { value: "edit", label: "Edit", icon: Pencil },
            { value: "history", label: "History", icon: History },
          ]}
        />
        <Button
          size="sm"
          variant="ghost"
          icon={Archive}
          disabled={pending}
          onClick={() => run(() => setKnowledgeStatusAction(id, status === "archived" ? "active" : "archived"))}
        >
          {status === "archived" ? "Reactivate" : "Archive"}
        </Button>
      </div>

      {mode === "read" ? (
        <Card>
          <CardBody className="pt-5">
            <MarkdownView content={defaults.body} />
          </CardBody>
        </Card>
      ) : mode === "edit" ? (
        <KnowledgeForm id={id} defaults={defaults} onDone={() => setMode("read")} />
      ) : (
        <Card>
          <CardBody className="divide-y divide-line pt-2">
            {versions.map((v) => (
              <div key={v.version} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-[13.5px] text-ink">
                    Version {v.version}
                    {v.version === currentVersion ? " (current)" : ""}
                  </p>
                  <p className="text-[12px] text-faint">
                    {v.title} · {formatDate(new Date(v.createdAt))}
                  </p>
                </div>
                {v.version !== currentVersion ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={RotateCcw}
                    disabled={pending}
                    onClick={() => run(() => restoreKnowledgeAction(id, v.version))}
                  >
                    Restore
                  </Button>
                ) : null}
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
