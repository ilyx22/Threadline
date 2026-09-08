import type { Metadata } from "next";
import { requireOrgPage } from "@/lib/auth/guard";
import { loadBrandBrain } from "@/lib/data/workspace";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DefinitionList } from "@/components/ui/data";
import { Notice } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badge";
import { PACKAGE_TIER_META, ORG_STATUS_META, metaOf } from "@/lib/domain/enums";
import { formatDate } from "@/lib/utils/dates";
import { WorkspaceForm } from "./workspace-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "workspace.view");
  const brain = await loadBrandBrain(ctx.org.id);
  const canEdit = ctx.can("workspace.settings");

  const packageMeta = metaOf(PACKAGE_TIER_META, ctx.org.packageTier);
  const statusMeta = metaOf(ORG_STATUS_META, ctx.org.status);

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="text-section">Workspace</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          How this workspace is configured. Content rules — platforms, cadence, pillars and banned
          topics — live in the Brand Brain, because they are context the system generates against.
        </p>
      </header>

      {!canEdit ? (
        <Notice tone="neutral">
          Your role can view these settings but not change them. A workspace admin can.
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Details" eyebrow="Workspace" />
            <WorkspaceForm
              slug={slug}
              canEdit={canEdit}
              defaults={{
                name: ctx.org.name,
                website: brain.org?.website ?? "",
                industry: brain.org?.industry ?? "",
                geography: brain.org?.geography ?? "",
                timezone: ctx.org.timezone,
              }}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Engagement" eyebrow="Managed by Threadline" />
            <CardBody className="pt-0">
              <DefinitionList
                columns={1}
                items={[
                  {
                    label: "Status",
                    value: <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>,
                  },
                  {
                    label: "Package",
                    value: (
                      <span>
                        <Badge tone={packageMeta.tone}>{packageMeta.label}</Badge>
                        {packageMeta.description ? (
                          <span className="mt-1.5 block text-[12px] text-muted">
                            {packageMeta.description}
                          </span>
                        ) : null}
                      </span>
                    ),
                  },
                  { label: "Currency", value: ctx.org.currency },
                  {
                    label: "Onboarding",
                    value: ctx.org.onboardingStage.replace(/_/g, " "),
                  },
                ]}
              />
              <p className="mt-4 border-t border-line pt-3 text-[11.5px] leading-relaxed text-ghost">
                Package and status are set by your Threadline operator. Contact them to change
                either.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Content rules" eyebrow="From the Brand Brain" />
            <CardBody className="pt-0">
              <DefinitionList
                columns={1}
                items={[
                  {
                    label: "Platforms",
                    value:
                      brain.blocks.contentRules.platforms.join(", ").replace(/_/g, " ") || "None set",
                  },
                  {
                    label: "Target cadence",
                    value: `${brain.blocks.contentRules.cadencePerWeek} per week`,
                  },
                  {
                    label: "Pillars",
                    value: brain.blocks.contentRules.pillars.join(", ") || "None set",
                  },
                  {
                    label: "Banned topics",
                    value: brain.blocks.contentRules.bannedTopics.join(", ") || "None",
                  },
                  {
                    label: "Brand Brain updated",
                    value: brain.updatedAt ? formatDate(brain.updatedAt) : "Never",
                  },
                ]}
              />
              <a
                href={`/app/${slug}/intelligence`}
                className="mt-4 inline-block text-[12.5px] text-accent transition-colors hover:text-accent-bright"
              >
                Edit in the Brand Brain
              </a>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
