import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireInternal } from "@/lib/auth/guard";
import { getKnowledgeDoc } from "@/lib/knowledge";
import { KNOWLEDGE_KIND_LABEL, type KnowledgeKind } from "@/lib/knowledge/chunk";
import { Breadcrumbs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/dates";
import { KnowledgeDocView } from "./doc-view";

export const metadata: Metadata = { title: "Knowledge" };

export default async function KnowledgeDocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireInternal("admin.sops");
  const doc = await getKnowledgeDoc(id);
  if (!doc) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs items={[{ label: "Knowledge", href: "/admin/knowledge" }, { label: doc.title }]} />
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="outline">{KNOWLEDGE_KIND_LABEL[doc.kind as KnowledgeKind] ?? doc.kind}</Badge>
          {doc.platform !== "all" ? <Badge tone="outline">{doc.platform}</Badge> : null}
          <Badge tone="accent">Version {doc.version}</Badge>
          {doc.status === "archived" ? <Badge tone="neutral">Archived</Badge> : null}
          <span className="text-[12px] text-ghost">Updated {formatDate(doc.updatedAt)}</span>
        </div>
        <h1 className="mt-3 text-hero">{doc.title}</h1>
        {doc.summary ? <p className="mt-2 text-[14px] leading-relaxed text-muted">{doc.summary}</p> : null}
        {doc.source ? <p className="mt-1 text-[12px] text-faint">Source: {doc.source}</p> : null}
      </header>
      <KnowledgeDocView
        id={doc.id}
        status={doc.status}
        currentVersion={doc.version}
        versions={doc.versions.map((v) => ({ version: v.version, title: v.title, createdAt: v.createdAt.toISOString() }))}
        defaults={{
          title: doc.title,
          kind: doc.kind,
          platform: doc.platform,
          summary: doc.summary ?? "",
          source: doc.source ?? "",
          body: doc.body,
        }}
      />
    </div>
  );
}
