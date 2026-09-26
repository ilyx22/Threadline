import type { Metadata } from "next";
import Link from "next/link";
import { requireOrgPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { appUrl } from "@/lib/app-url";
import { InboundSources } from "./inbound-client";

export const metadata: Metadata = { title: "Inbound sources" };

/** Authorised inbound lead sources (AI-06). */
export default async function InboundPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "pipeline.edit");
  const sources = await prisma.inboundSource.findMany({ where: { orgId: ctx.org.id }, orderBy: { createdAt: "desc" } });
  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <Link href={`/app/${slug}/pipeline`} className="text-[12px] text-faint hover:text-muted">
          Pipeline
        </Link>
        <h1 className="mt-1 text-section">Inbound sources</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          A source lets your website form, a Zapier step or an import send leads into this pipeline. Each has its own token; revoke one and only that source stops. Direct messages on platforms without an authorised API are added by hand from the pipeline.
        </p>
      </header>
      <section className="rounded-md border border-line p-4 text-[12.5px] text-muted">
        <p className="font-medium text-ink">How to send a lead</p>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[12px]">{`POST ${appUrl()}/api/inbound/leads
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "Sam Lee", "email": "sam@example.com", "message": "…", "externalRef": "form-123" }`}</pre>
        <p className="mt-2">A repeated externalRef is ignored, so retries are safe. Up to 200 leads can be sent at once as {"{ \"leads\": [...] }"}.</p>
      </section>
      <InboundSources
        slug={slug}
        sources={sources.map((s) => ({ id: s.id, label: s.label, channel: s.channel, createdAt: s.createdAt.toISOString(), lastUsedAt: s.lastUsedAt?.toISOString() ?? null, revoked: Boolean(s.revokedAt) }))}
      />
    </div>
  );
}
