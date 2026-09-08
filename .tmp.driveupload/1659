import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, Check } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { packagingQueue } from "@/lib/data/content";
import { PLATFORM_META, metaOf } from "@/lib/domain/enums";
import { Badge, Pill } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { StageBadge } from "@/components/ui/status";

export const metadata: Metadata = { title: "Packaging" };

export default async function PackagingPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "distribution.view");
  const items = await packagingQueue(ctx.org.id);

  const unpackaged = items.filter((i) => i.packages.length === 0);
  const packaged = items.filter((i) => i.packages.length > 0);

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="text-section">Packaging</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Approved content, prepared for each destination. Every platform gets genuinely different
          copy — a LinkedIn argument, a searchable YouTube title, a compressed post for X — rather
          than one caption reused everywhere.
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Nothing to package"
          description="Content becomes available for packaging once it has been approved."
          action={
            <ButtonLink href={`/app/${slug}/production`} variant="secondary">
              Open the production board
            </ButtonLink>
          }
        />
      ) : (
        <>
          {unpackaged.length > 0 ? (
            <Card accent>
              <CardHeader
                title={`${unpackaged.length} approved ${unpackaged.length === 1 ? "piece" : "pieces"} not yet packaged`}
                eyebrow="Needs packaging"
                description="These cannot be scheduled until they have copy for their destination."
              />
              <CardBody className="pt-0">
                <ul className="divide-y divide-line">
                  {unpackaged.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
                      <Link
                        href={`/app/${slug}/production/${item.id}`}
                        className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink transition-colors hover:text-accent"
                      >
                        {item.title}
                      </Link>
                      <Pill>{metaOf(PLATFORM_META, item.platform).label}</Pill>
                      <StageBadge stage={item.stage} />
                      <ButtonLink
                        href={`/app/${slug}/production/${item.id}`}
                        size="xs"
                        variant="secondary"
                      >
                        Package
                      </ButtonLink>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader
              title="Packaged"
              eyebrow={`${packaged.length} ${packaged.length === 1 ? "piece" : "pieces"}`}
            />
            <CardBody className="pt-0">
              {packaged.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-faint">
                  Nothing packaged yet.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {packaged.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
                      <Link
                        href={`/app/${slug}/production/${item.id}`}
                        className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink transition-colors hover:text-accent"
                      >
                        {item.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.packages.map((pkg) => (
                          <Badge
                            key={pkg.id}
                            tone={pkg.status === "ready" ? "positive" : "outline"}
                            icon={pkg.status === "ready" ? Check : undefined}
                          >
                            {metaOf(PLATFORM_META, pkg.platform).label}
                          </Badge>
                        ))}
                      </div>
                      <StageBadge stage={item.stage} />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
