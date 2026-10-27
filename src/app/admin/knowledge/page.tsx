import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { requireInternal } from "@/lib/auth/guard";
import { listKnowledgeDocs } from "@/lib/knowledge";
import { KNOWLEDGE_KINDS, KNOWLEDGE_KIND_LABEL, type KnowledgeKind } from "@/lib/knowledge/chunk";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils/dates";
import { KnowledgeForm } from "./knowledge-form";

export const metadata: Metadata = { title: "Knowledge" };

type Doc = Awaited<ReturnType<typeof listKnowledgeDocs>>[number];

export default async function KnowledgePage() {
  await requireInternal("admin.sops");
  const docs = await listKnowledgeDocs();
  const active = docs.filter((d) => d.status === "active");
  const groups = KNOWLEDGE_KINDS.map((kind) => ({ kind, items: active.filter((d) => d.kind === kind) })).filter(
    (g) => g.items.length > 0,
  );
  const archived = docs.filter((d) => d.status === "archived");

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="text-section">Knowledge base</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Threadline&apos;s own methods: SOPs, frameworks, winning and losing scripts, course notes,
          objections and style rules. The relevant parts go into every idea, script and hook the AI
          writes. Staff only; never shown to clients, and course material is never quoted.
        </p>
      </header>

      {docs.length === 0 ? (
        <EmptyState icon={BookOpen} title="Nothing here yet" description="Add the first document below." />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <DocGroup key={group.kind} label={KNOWLEDGE_KIND_LABEL[group.kind]} docs={group.items} />
          ))}
          {archived.length > 0 ? <DocGroup label="Archived (not used)" docs={archived} /> : null}
        </div>
      )}

      <section className="max-w-3xl">
        <h2 className="text-eyebrow mb-3 text-faint">Add a document</h2>
        <KnowledgeForm />
      </section>
    </div>
  );
}

function DocGroup({ label, docs }: { label: string; docs: Doc[] }) {
  return (
    <section>
      <h2 className="text-eyebrow mb-3 text-faint">{label}</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {docs.map((doc) => (
          <Link key={doc.id} href={`/admin/knowledge/${doc.id}`}>
            <Card interactive className="h-full">
              <CardBody className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] font-medium leading-snug text-ink">{doc.title}</p>
                  <Badge tone="outline">v{doc.version}</Badge>
                </div>
                {doc.summary ? (
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{doc.summary}</p>
                ) : null}
                <p className="mt-3 text-[11.5px] text-ghost">
                  {KNOWLEDGE_KIND_LABEL[doc.kind as KnowledgeKind] ?? doc.kind}
                  {doc.platform !== "all" ? ` · ${doc.platform}` : ""} · {doc._count.chunks} sections ·{" "}
                  {formatDate(doc.updatedAt)}
                </p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
