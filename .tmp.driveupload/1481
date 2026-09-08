import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText } from "lucide-react";
import { requireInternal } from "@/lib/auth/guard";
import { listSops } from "@/lib/data/admin";
import { SOP_CATEGORIES, SOP_CATEGORY_META } from "@/lib/domain/enums";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "SOPs" };

export default async function SopsPage() {
  await requireInternal("admin.sops");
  const sops = await listSops();

  const byCategory = SOP_CATEGORIES.map((category) => ({
    category,
    items: sops.filter((s) => s.category === category),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="text-section">Operating procedures</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          How Threadline actually runs. These are working documents — edit them when the process
          changes, and version them so a change is visible.
        </p>
      </header>

      {sops.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No SOPs yet"
          description="The seed installs the standard set. Run the seed, or create documents manually."
        />
      ) : (
        <div className="space-y-8">
          {byCategory.map((group) => (
            <section key={group.category}>
              <h2 className="text-eyebrow mb-3 text-faint">
                {SOP_CATEGORY_META[group.category].label}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((sop) => (
                  <Link key={sop.id} href={`/admin/sops/${sop.key}`}>
                    <Card interactive className="h-full">
                      <CardBody className="pt-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[14px] font-medium leading-snug text-ink">
                            {sop.title}
                          </p>
                          <Badge tone="outline">v{sop.version}</Badge>
                        </div>
                        {sop.summary ? (
                          <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                            {sop.summary}
                          </p>
                        ) : null}
                        <p className="mt-3 text-[11px] text-ghost">
                          Updated {formatDate(sop.updatedAt, "short")}
                          {sop.updatedBy ? ` by ${sop.updatedBy.name}` : ""}
                        </p>
                      </CardBody>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
