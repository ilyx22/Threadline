import type { Metadata } from "next";
import { Mic } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { estimateRecordingMinutes, recordingQueue } from "@/lib/data/scripts";
import { listContent } from "@/lib/data/content";
import { EmptyState } from "@/components/ui/feedback";
import { RecordingRoom } from "./recording-room";

export const metadata: Metadata = { title: "Recording Room" };

export default async function RecordingPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "recording.view");

  const [queue, awaitingFootage] = await Promise.all([
    recordingQueue(ctx.org.id),
    listContent(ctx.org.id, { stage: ["raw"] }),
  ]);

  if (queue.length === 0 && awaitingFootage.length === 0) {
    return (
      <div className="space-y-6">
        <header className="max-w-2xl">
          <h1 className="text-section">Recording Room</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Everything approved and waiting for you to record, in one place.
          </p>
        </header>
        <EmptyState
          icon={Mic}
          title="Nothing to record"
          description="Scripts appear here once they are approved. When the queue is empty, the constraint is upstream — in scripting or approvals, not with you."
        />
      </div>
    );
  }

  // Approved-and-ready first; the rest is visible but clearly separated.
  const ready = queue.filter((q) => q.qaState === "approved");
  const notReady = queue.filter((q) => q.qaState !== "approved");

  return (
    <RecordingRoom
      slug={slug}
      canComplete={ctx.can("recording.complete")}
      canUpload={ctx.can("library.upload")}
      estimateMinutes={estimateRecordingMinutes(ready)}
      ready={ready.map((item) => ({
        id: item.id,
        title: item.title,
        hook: item.hook,
        altHooks: item.altHooks,
        body: item.body,
        cta: item.cta,
        filmingNotes: item.filmingNotes,
        estimatedSeconds: item.estimatedSeconds,
        platform: item.platform,
        scriptType: item.scriptType,
        pillar: item.pillar,
        priorityScore: item.priorityScore,
        qaState: item.qaState,
        unverifiedClaims: item.claims.filter((c) => c.status === "unverified").length,
      }))}
      notReady={notReady.map((item) => ({
        id: item.id,
        title: item.title,
        qaState: item.qaState,
        unverifiedClaims: item.claims.filter((c) => c.status === "unverified").length,
      }))}
      awaitingFootage={awaitingFootage.map((item) => ({
        id: item.id,
        title: item.title,
        recordedAt: item.recordedAt ? item.recordedAt.toISOString() : null,
        assetCount: item._count.assets,
      }))}
    />
  );
}
