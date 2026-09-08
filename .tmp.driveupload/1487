import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireInternal } from "@/lib/auth/guard";
import { getSop } from "@/lib/data/admin";
import { Breadcrumbs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/dates";
import { SopEditor } from "./sop-editor";

export const metadata: Metadata = { title: "SOP" };

export default async function SopDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  await requireInternal("admin.sops");

  const sop = await getSop(key);
  if (!sop) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs items={[{ label: "SOPs", href: "/admin/sops" }, { label: sop.title }]} />

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="outline">{sop.category}</Badge>
          <Badge tone="accent">Version {sop.version}</Badge>
          <span className="text-[12px] text-ghost">
            Updated {formatDate(sop.updatedAt)}
            {sop.updatedBy ? ` by ${sop.updatedBy.name}` : ""}
          </span>
        </div>
        <h1 className="mt-3 text-hero">{sop.title}</h1>
        {sop.summary ? (
          <p className="mt-2 text-[14px] leading-relaxed text-muted">{sop.summary}</p>
        ) : null}
      </header>

      <SopEditor
        sopKey={sop.key}
        defaults={{
          title: sop.title,
          category: sop.category,
          summary: sop.summary ?? "",
          body: sop.body,
        }}
      />
    </div>
  );
}
