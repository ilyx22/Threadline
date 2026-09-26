import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { INQUIRY_STAGE_META, metaOf } from "@/lib/domain/enums";
import { LeadWorkbench } from "./lead-client";

export const metadata: Metadata = { title: "Lead" };

/** One lead (AI-06): thread, owner, qualification evidence, follow-up and reply drafts. */
export default async function LeadPage({ params }: { params: Promise<{ org: string; id: string }> }) {
  const { org: slug, id } = await params;
  const ctx = await requireOrgPage(slug, "pipeline.view");
  const lead = await prisma.inquiry.findFirst({
    where: { id, orgId: ctx.org.id },
    include: { messages: { orderBy: { occurredAt: "asc" }, take: 200 }, replyDrafts: { where: { status: { not: "discarded" } }, orderBy: { createdAt: "desc" }, take: 10 } },
  });
  if (!lead) notFound();
  const members = await prisma.membership.findMany({ where: { orgId: ctx.org.id, status: "active" }, select: { userId: true, user: { select: { name: true } } } });
  const qualification = lead.qualification ? (JSON.parse(lead.qualification) as { criterion: string; note: string; at: string }[]) : [];
  const stage = metaOf(INQUIRY_STAGE_META, lead.stage);

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <Link href={`/app/${slug}/pipeline`} className="text-[12px] text-faint hover:text-muted">
          Pipeline
        </Link>
        <h1 className="mt-1 text-section">{lead.name}</h1>
        <p className="mt-1 text-[13px] text-muted">
          {[lead.company, lead.email, stage.label, lead.channel.replace(/_/g, " "), lead.evidenceSource ? `from ${lead.evidenceSource}` : null].filter(Boolean).join(" · ")}
        </p>
      </header>
      <LeadWorkbench
        slug={slug}
        canEdit={ctx.can("pipeline.edit")}
        lead={{
          id: lead.id,
          ownerId: lead.ownerId,
          followUpAt: lead.followUpAt ? lead.followUpAt.toISOString().slice(0, 10) : null,
          firstResponseAt: lead.firstResponseAt ? lead.firstResponseAt.toISOString() : null,
          occurredAt: lead.occurredAt.toISOString(),
        }}
        members={members.map((m) => ({ id: m.userId, name: m.user.name }))}
        messages={lead.messages.map((m) => ({ id: m.id, direction: m.direction, body: m.body, at: m.occurredAt.toISOString() }))}
        qualification={qualification}
        drafts={lead.replyDrafts.map((d) => ({ id: d.id, body: d.body, status: d.status, generatedBy: d.generatedBy, isDemo: d.isDemo }))}
      />
    </div>
  );
}
