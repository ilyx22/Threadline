import * as React from "react";
import { Badge } from "./badge";
import { cn } from "@/lib/utils/cn";
import {
  APPLICATION_STATUS_META,
  CONTENT_STAGE_META,
  CONTENT_STAGES,
  IDEA_STATUS_META,
  INQUIRY_STAGE_META,
  INTEGRATION_STATUS_META,
  ISSUE_STATUS_META,
  ORG_STATUS_META,
  PATTERN_KIND_META,
  PATTERN_STATUS_META,
  PLATFORM_META,
  PUBLISH_STATUS_META,
  RESEARCH_KIND_META,
  ROLE_META,
  SCRIPT_QA_META,
  SEVERITY_META,
  metaOf,
  type ContentStage,
} from "@/lib/domain/enums";

/**
 * Status badges read their label and tone from the domain metadata, so a status
 * renders identically everywhere it appears and adding a status is a one-line
 * change in `enums.ts` rather than a hunt through components.
 */

export function StageBadge({ stage, className }: { stage: string; className?: string }) {
  const meta = metaOf(CONTENT_STAGE_META, stage);
  return (
    <Badge tone={meta.tone} className={className} dot>
      {meta.label}
    </Badge>
  );
}

export function IdeaStatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = metaOf(IDEA_STATUS_META, status);
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}

export function ScriptQaBadge({ state, className }: { state: string; className?: string }) {
  const meta = metaOf(SCRIPT_QA_META, state);
  return (
    <Badge tone={meta.tone} className={className} dot={state === "needs_fact_check"}>
      {meta.label}
    </Badge>
  );
}

export function PublishStatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = metaOf(PUBLISH_STATUS_META, status);
  return (
    <Badge tone={meta.tone} className={className} dot>
      {meta.label}
    </Badge>
  );
}

export function PatternKindBadge({ kind, className }: { kind: string; className?: string }) {
  const meta = metaOf(PATTERN_KIND_META, kind);
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}

export function PatternStatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = metaOf(PATTERN_STATUS_META, status);
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}

export function ResearchKindBadge({ kind, className }: { kind: string; className?: string }) {
  const meta = metaOf(RESEARCH_KIND_META, kind);
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}

export function InquiryStageBadge({ stage, className }: { stage: string; className?: string }) {
  const meta = metaOf(INQUIRY_STAGE_META, stage);
  return (
    <Badge tone={meta.tone} className={className} dot>
      {meta.label}
    </Badge>
  );
}

export function OrgStatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = metaOf(ORG_STATUS_META, status);
  return (
    <Badge tone={meta.tone} className={className} dot>
      {meta.label}
    </Badge>
  );
}

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const meta = metaOf(ROLE_META, role);
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}

export function SeverityBadge({ severity, className }: { severity: string; className?: string }) {
  const meta = metaOf(SEVERITY_META, severity);
  return (
    <Badge tone={meta.tone} className={className} dot={severity === "critical"}>
      {meta.label}
    </Badge>
  );
}

export function IssueStatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = metaOf(ISSUE_STATUS_META, status);
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}

export function IntegrationStatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = metaOf(INTEGRATION_STATUS_META, status);
  return (
    <Badge tone={meta.tone} className={className} dot>
      {meta.label}
    </Badge>
  );
}

export function ApplicationStatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = metaOf(APPLICATION_STATUS_META, status);
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}

export function PlatformLabel({ platform, className }: { platform: string; className?: string }) {
  const meta = metaOf(PLATFORM_META, platform);
  return <span className={cn("text-[12px] text-muted", className)}>{meta.label}</span>;
}

/**
 * Horizontal pipeline indicator showing where a piece sits in the seven
 * production stages. Communicates progress at a glance without a chart.
 */
export function StageProgress({ stage, className }: { stage: string; className?: string }) {
  const index = CONTENT_STAGES.indexOf(stage as ContentStage);
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label={`Stage ${index + 1} of ${CONTENT_STAGES.length}: ${metaOf(CONTENT_STAGE_META, stage).label}`}
    >
      {CONTENT_STAGES.map((s, i) => (
        <span
          key={s}
          className="h-1 w-3 rounded-full transition-colors"
          style={{
            backgroundColor:
              i <= index && index >= 0
                ? CONTENT_STAGE_META[s].color
                : "var(--color-raised)",
            opacity: i === index ? 1 : i < index ? 0.5 : 1,
          }}
        />
      ))}
    </div>
  );
}
