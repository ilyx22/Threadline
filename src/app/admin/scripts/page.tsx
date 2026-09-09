import type { Metadata } from "next";
import { requireInternal } from "@/lib/auth/guard";
import { listScripts, scriptImportState, SCRIPT_STAGES } from "@/lib/sales/scripts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/feedback";
import { ScriptsAdmin } from "./scripts-admin";

export const metadata: Metadata = { title: "Sales scripts" };

export default async function ScriptsPage() {
  await requireInternal("admin.sops");
  const [scripts, state] = await Promise.all([listScripts({ includeRetired: true }), scriptImportState()]);

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="text-section">Sales scripts</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Exact wording, versioned and checksummed. AI can choose which block fits a moment; it cannot rewrite one. Using a block on a call freezes that exact text against the call record.
        </p>
      </header>

      {state.canonicalImportRequired ? (
        <Notice tone="warning" title="CANONICAL COPY IMPORT REQUIRED">
          No approved script exists yet. The working documents are marked draft; import them verbatim, read each block, and approve the ones that are the canonical wording. Nothing is offered on a call until then.
        </Notice>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Badge tone="outline">{state.total} blocks</Badge>
        <Badge tone="positive">{state.approved} approved</Badge>
        <Badge tone="warning">{state.draft} draft</Badge>
      </div>

      <ScriptsAdmin scripts={scripts.map((s) => ({ id: s.id, key: s.key, version: s.version, stage: s.stage, context: s.context, exactText: s.exactText, checksum: s.checksum, status: s.status, provenance: s.provenance, approvedAt: s.approvedAt?.toISOString() ?? null, retiredAt: s.retiredAt?.toISOString() ?? null }))} stages={[...SCRIPT_STAGES]} />

      <Card>
        <CardHeader title="Rules" eyebrow="How this is used" />
        <CardBody className="pt-0 text-[13px] leading-relaxed text-muted">
          <ul className="list-disc space-y-1 pl-5">
            <li>One approved version per key. Approving a new version retires the old one; retired blocks stay readable for the calls that used them.</li>
            <li>A checksum mismatch refuses approval and use — the stored text is the text.</li>
            <li>Provenance names the document, author or date the wording came from. A block without provenance is not canonical, it is a guess.</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
