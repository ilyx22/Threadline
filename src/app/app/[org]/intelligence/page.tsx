import type { Metadata } from "next";
import { Brain } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { currentBrainVersion, listBrainVersions, staleDrafts } from "@/lib/ai/brain-versions";
import { BrainVersions } from "./brain-versions";
import { loadBrandBrain } from "@/lib/data/workspace";
import { COMPLETENESS_LABELS, COMPLETENESS_SECTIONS } from "@/lib/domain/brand-brain";
import { Card, CardBody } from "@/components/ui/card";
import { Progress } from "@/components/ui/controls";
import { Notice } from "@/components/ui/feedback";
import { BrandBrainEditor } from "./brand-brain-editor";
import {
  saveCompanyProfileAction,
  saveContentRulesAction,
  saveFounderProfileAction,
  saveVoiceProfileAction,
} from "@/lib/actions/workspace";

export const metadata: Metadata = { title: "Brand Brain" };

export default async function BrandBrainPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "brain.view");
  const data = await loadBrandBrain(ctx.org.id);
  const canEdit = ctx.can("brain.edit");
  const [brainCurrent, brainVersions, staleScripts] = await Promise.all([currentBrainVersion(ctx.org.id), listBrainVersions(ctx.org.id, 12), staleDrafts(ctx.org.id)]);

  const weakest = COMPLETENESS_SECTIONS.map((key) => ({ key, value: data.sections[key] }))
    .sort((a, b) => a.value - b.value)
    .filter((s) => s.value < 70)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Brand Brain</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Everything Threadline knows about the business, the offer, the customer and the founder.
            This is the context behind every idea, script and caption the system produces — when
            output starts sounding generic, it is almost always because a section here is thin.
          </p>
        </div>

        <Card className="w-full shrink-0 lg:w-72">
          <CardBody className="pt-4">
            <div className="flex items-baseline justify-between">
              <p className="text-eyebrow text-faint">Context strength</p>
              <p className="text-[19px] font-medium tabular text-accent">{data.completeness}%</p>
            </div>
            <Progress value={data.completeness} className="mt-3" />
            <ul className="mt-4 space-y-1.5">
              {COMPLETENESS_SECTIONS.map((key) => (
                <li key={key} className="flex items-center gap-2 text-[11.5px]">
                  <span className="flex-1 text-muted">{COMPLETENESS_LABELS[key]}</span>
                  <span
                    className={
                      data.sections[key] >= 70
                        ? "tabular text-positive"
                        : data.sections[key] >= 40
                          ? "tabular text-warning"
                          : "tabular text-negative"
                    }
                  >
                    {data.sections[key]}%
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </header>

      {weakest.length > 0 ? (
        <Notice tone="warning" icon={Brain} title="Where the context is thin">
          {weakest.map((s) => COMPLETENESS_LABELS[s.key]).join(", ")} — generated output will be
          noticeably more generic until {weakest.length === 1 ? "this section is" : "these sections are"}{" "}
          filled in.
        </Notice>
      ) : null}

      <BrandBrainEditor
        slug={slug}
        canEdit={canEdit}
        blocks={data.blocks}
        offers={data.offers}
        icps={data.icps}
        proof={data.proof}
        currency={ctx.org.currency}
        actions={{
          saveCompany: saveCompanyProfileAction.bind(null, slug),
          saveFounder: saveFounderProfileAction.bind(null, slug),
          saveVoice: saveVoiceProfileAction.bind(null, slug),
          saveRules: saveContentRulesAction.bind(null, slug),
        }}
      />
      <BrainVersions
        slug={slug}
        current={brainCurrent ?? 1}
        versions={brainVersions.map((v) => ({ version: v.version, changed: JSON.parse(v.changed) as string[], createdAt: v.createdAt.toISOString() }))}
        stale={staleScripts}
        canEdit={canEdit}
      />
    </div>
  );
}
