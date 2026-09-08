"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/controls";
import { Notice } from "@/components/ui/feedback";
import { Wordmark, ThreadMark } from "@/components/brand/logo";
import { toast } from "@/components/ui/toast";
import {
  ONBOARDING_STEPS,
  onboardingProgress,
  stepIndex,
  stepMeta,
  totalEstimateMinutes,
  type OnboardingData,
} from "@/lib/domain/onboarding";
import { buildWorkspaceAction, saveOnboardingStepAction } from "@/lib/actions/onboarding";
import { PLATFORM_OPTIONS } from "@/lib/domain/enums";
import { minutes } from "@/lib/utils/format";

/**
 * Onboarding.
 *
 * One decision per screen, visible progress, autosave on every advance, and
 * lossless back-navigation. The founder can leave at any point and return to
 * exactly where they were — the answers are already on the server.
 */
export function OnboardingFlow({
  slug,
  orgName,
  founderName,
  currentStep,
  completedSteps,
  data: initialData,
}: {
  slug: string;
  orgName: string;
  founderName: string;
  currentStep: string;
  completedSteps: string[];
  data: OnboardingData;
}) {
  const router = useRouter();
  const [step, setStep] = React.useState(currentStep);
  const [data, setData] = React.useState<OnboardingData>(initialData);
  const [completed, setCompleted] = React.useState<string[]>(completedSteps);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, startTransition] = React.useTransition();
  const [saving, setSaving] = React.useState<"idle" | "saving" | "saved">("idle");

  const meta = stepMeta(step);
  const index = stepIndex(step);
  const progress = onboardingProgress(completed);

  const set = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const setLines = (key: keyof OnboardingData, value: string) => {
    set(
      key,
      value
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean) as OnboardingData[typeof key],
    );
  };

  const lines = (key: keyof OnboardingData) => {
    const value = data[key];
    return Array.isArray(value) ? value.join("\n") : "";
  };

  const advance = () => {
    setSaving("saving");
    startTransition(async () => {
      const result = await saveOnboardingStepAction(slug, step, data as Record<string, unknown>, true);
      if (result.ok) {
        setErrors({});
        setCompleted((prev) => (prev.includes(step) ? prev : [...prev, step]));
        setStep(result.data.nextStep);
        setSaving("saved");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSaving("idle");
        setErrors(result.fieldErrors ?? {});
        toast.error(result.error);
      }
    });
  };

  const goBack = () => {
    const previous = ONBOARDING_STEPS[Math.max(0, index - 1)]!.key;
    setSaving("saving");
    startTransition(async () => {
      // Save without validating, so going back never loses a partial answer.
      await saveOnboardingStepAction(slug, step, data as Record<string, unknown>, false);
      setStep(previous);
      setSaving("saved");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const jumpTo = (target: string) => {
    setSaving("saving");
    startTransition(async () => {
      await saveOnboardingStepAction(slug, step, data as Record<string, unknown>, false);
      setStep(target);
      setSaving("saved");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-base">
      {/* --------------------------------- Header --------------------------------- */}
      <header className="sticky top-0 z-30 border-b border-line bg-base/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:px-6">
          <Wordmark size="sm" />
          <div className="hidden flex-1 items-center gap-3 sm:flex">
            <Progress value={progress} className="max-w-xs" />
            <span className="text-[11.5px] tabular text-faint">{progress}%</span>
          </div>
          <div className="ml-auto flex items-center gap-3 text-[11.5px] text-ghost">
            {saving === "saving" ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="size-3 animate-spin" aria-hidden />
                Saving
              </span>
            ) : saving === "saved" ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3 text-positive" aria-hidden />
                Saved
              </span>
            ) : null}
            <span className="hidden sm:inline">{orgName}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 gap-10 px-4 py-10 sm:px-6">
        {/* ------------------------------- Step rail ------------------------------- */}
        <nav className="hidden w-52 shrink-0 lg:block" aria-label="Onboarding steps">
          <ol className="space-y-0.5">
            {ONBOARDING_STEPS.filter((s) => s.key !== "build" && s.key !== "done").map((s) => {
              const isDone = completed.includes(s.key);
              const isCurrent = s.key === step;
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => (isDone || isCurrent ? jumpTo(s.key) : undefined)}
                    disabled={!isDone && !isCurrent}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[12.5px] transition-colors",
                      isCurrent
                        ? "bg-raised text-ink"
                        : isDone
                          ? "text-muted hover:bg-raised/60"
                          : "cursor-default text-ghost",
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="size-3.5 shrink-0 text-positive" aria-hidden />
                    ) : isCurrent ? (
                      <Circle className="size-3.5 shrink-0 fill-accent text-accent" aria-hidden />
                    ) : (
                      <Circle className="size-3.5 shrink-0" aria-hidden />
                    )}
                    <span className="flex-1 truncate">{s.title}</span>
                    {s.optional ? <span className="text-[10px] text-ghost">opt</span> : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* --------------------------------- Content -------------------------------- */}
        <main className="min-w-0 flex-1">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <span className="text-eyebrow text-accent">{meta.number}</span>
              <span className="text-eyebrow text-faint">{meta.title}</span>
              {meta.optional ? <Badge tone="outline">Optional</Badge> : null}
            </div>
            <h1 className="mt-3 text-hero">{meta.subtitle}</h1>
            {meta.why ? (
              <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-muted">{meta.why}</p>
            ) : null}
          </div>

          <div className="space-y-6">
            {step === "welcome" ? (
              <WelcomeStep founderName={founderName} orgName={orgName} />
            ) : null}

            {step === "business" ? (
              <>
                <Field label="Company name" htmlFor="companyName" error={errors.companyName}>
                  <Input
                    id="companyName"
                    value={data.companyName ?? ""}
                    onChange={(e) => set("companyName", e.target.value)}
                    autoFocus
                  />
                </Field>
                <Field
                  label="What the company does"
                  htmlFor="description"
                  hint="Describe it the way you would to another founder, not the way it appears on your website."
                  error={errors.description}
                >
                  <Textarea
                    id="description"
                    rows={5}
                    value={data.description ?? ""}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Website" htmlFor="website" optional>
                    <Input
                      id="website"
                      value={data.website ?? ""}
                      onChange={(e) => set("website", e.target.value)}
                      placeholder="https://"
                    />
                  </Field>
                  <Field label="Industry" htmlFor="industry" optional>
                    <Input
                      id="industry"
                      value={data.industry ?? ""}
                      onChange={(e) => set("industry", e.target.value)}
                    />
                  </Field>
                  <Field label="Geography" htmlFor="geography" optional>
                    <Input
                      id="geography"
                      value={data.geography ?? ""}
                      onChange={(e) => set("geography", e.target.value)}
                    />
                  </Field>
                  <Field label="Team size" htmlFor="teamSize" optional>
                    <Input
                      id="teamSize"
                      value={data.teamSize ?? ""}
                      onChange={(e) => set("teamSize", e.target.value)}
                    />
                  </Field>
                </div>
              </>
            ) : null}

            {step === "offer" ? (
              <>
                <Field label="What do you sell?" htmlFor="offerName" error={errors.offerName}>
                  <Input
                    id="offerName"
                    value={data.offerName ?? ""}
                    onChange={(e) => set("offerName", e.target.value)}
                    autoFocus
                    placeholder="The name of your main offer"
                  />
                </Field>
                <Field
                  label="What outcome does it produce?"
                  htmlFor="offerOutcome"
                  hint="The change in their business, not the deliverables."
                  error={errors.offerOutcome}
                >
                  <Textarea
                    id="offerOutcome"
                    rows={3}
                    value={data.offerOutcome ?? ""}
                    onChange={(e) => set("offerOutcome", e.target.value)}
                  />
                </Field>
                <Field
                  label="How does it work?"
                  htmlFor="offerMechanism"
                  hint="The mechanism. This is what content explains without pitching."
                >
                  <Textarea
                    id="offerMechanism"
                    rows={5}
                    value={data.offerMechanism ?? ""}
                    onChange={(e) => set("offerMechanism", e.target.value)}
                  />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Price" htmlFor="offerPrice" optional>
                    <Input
                      id="offerPrice"
                      type="number"
                      min={0}
                      value={data.offerPrice ?? ""}
                      onChange={(e) => set("offerPrice", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Pricing model" htmlFor="offerPriceModel">
                    <NativeSelect
                      id="offerPriceModel"
                      value={data.offerPriceModel ?? "one_off"}
                      onChange={(e) => set("offerPriceModel", e.target.value)}
                    >
                      <option value="one_off">One-off</option>
                      <option value="retainer">Retainer</option>
                      <option value="subscription">Subscription</option>
                      <option value="hybrid">Hybrid</option>
                    </NativeSelect>
                  </Field>
                </div>
                <Field
                  label="What makes it different?"
                  htmlFor="offerDifferentiators"
                  hint="One per line."
                >
                  <Textarea
                    id="offerDifferentiators"
                    rows={4}
                    value={lines("offerDifferentiators")}
                    onChange={(e) => setLines("offerDifferentiators", e.target.value)}
                  />
                </Field>
                <Field label="Calls to action" htmlFor="offerCtas" hint="One per line. Used verbatim.">
                  <Textarea
                    id="offerCtas"
                    rows={3}
                    value={lines("offerCtas")}
                    onChange={(e) => setLines("offerCtas", e.target.value)}
                  />
                </Field>
                <Field
                  label="Proof you can point to"
                  htmlFor="proofItems"
                  hint="One per line. Results, testimonials, credentials. We mark these for review before anything is stated as fact."
                  optional
                >
                  <Textarea
                    id="proofItems"
                    rows={4}
                    value={lines("proofItems")}
                    onChange={(e) => setLines("proofItems", e.target.value)}
                  />
                </Field>
              </>
            ) : null}

            {step === "customer" ? (
              <>
                <Field label="Who do you serve?" htmlFor="icpName" error={errors.icpName}>
                  <Input
                    id="icpName"
                    value={data.icpName ?? ""}
                    onChange={(e) => set("icpName", e.target.value)}
                    autoFocus
                    placeholder="B2B SaaS founders, £500k–£5m revenue"
                  />
                </Field>
                <Field label="Describe them" htmlFor="icpDescription">
                  <Textarea
                    id="icpDescription"
                    rows={4}
                    value={data.icpDescription ?? ""}
                    onChange={(e) => set("icpDescription", e.target.value)}
                  />
                </Field>
                <Field
                  label="What are they struggling with?"
                  htmlFor="icpPains"
                  hint="One per line. Use their words if you have them — this is the raw material of every hook."
                  error={errors.icpPains}
                >
                  <Textarea
                    id="icpPains"
                    rows={6}
                    value={lines("icpPains")}
                    onChange={(e) => setLines("icpPains", e.target.value)}
                  />
                </Field>
                <Field label="What do they want instead?" htmlFor="icpDesires" hint="One per line.">
                  <Textarea
                    id="icpDesires"
                    rows={4}
                    value={lines("icpDesires")}
                    onChange={(e) => setLines("icpDesires", e.target.value)}
                  />
                </Field>
                <Field
                  label="What objections do you hear?"
                  htmlFor="icpObjections"
                  hint="One per line. Verbatim is better than paraphrased."
                >
                  <Textarea
                    id="icpObjections"
                    rows={5}
                    value={lines("icpObjections")}
                    onChange={(e) => setLines("icpObjections", e.target.value)}
                  />
                </Field>
                <Field
                  label="What makes them start looking?"
                  htmlFor="icpTriggers"
                  hint="One per line. The events that create urgency."
                >
                  <Textarea
                    id="icpTriggers"
                    rows={4}
                    value={lines("icpTriggers")}
                    onChange={(e) => setLines("icpTriggers", e.target.value)}
                  />
                </Field>
              </>
            ) : null}

            {step === "founder" ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Your name" htmlFor="founderName" error={errors.founderName}>
                    <Input
                      id="founderName"
                      value={data.founderName ?? founderName}
                      onChange={(e) => set("founderName", e.target.value)}
                      autoFocus
                    />
                  </Field>
                  <Field label="Title" htmlFor="founderTitle" optional>
                    <Input
                      id="founderTitle"
                      value={data.founderTitle ?? "Founder"}
                      onChange={(e) => set("founderTitle", e.target.value)}
                    />
                  </Field>
                </div>
                <Field
                  label="Your background"
                  htmlFor="founderBio"
                  hint="Why anyone should listen to you on this topic."
                  error={errors.founderBio}
                >
                  <Textarea
                    id="founderBio"
                    rows={5}
                    value={data.founderBio ?? ""}
                    onChange={(e) => set("founderBio", e.target.value)}
                  />
                </Field>
                <Field
                  label="What do you believe that most people in your market do not?"
                  htmlFor="founderBeliefs"
                  hint="One per line. These become your strongest content."
                >
                  <Textarea
                    id="founderBeliefs"
                    rows={5}
                    value={lines("founderBeliefs")}
                    onChange={(e) => setLines("founderBeliefs", e.target.value)}
                  />
                </Field>
                <Field
                  label="Strong opinions you will defend publicly"
                  htmlFor="founderOpinions"
                  hint="One per line."
                >
                  <Textarea
                    id="founderOpinions"
                    rows={4}
                    value={lines("founderOpinions")}
                    onChange={(e) => setLines("founderOpinions", e.target.value)}
                  />
                </Field>
                <Field
                  label="Stories you are willing to tell"
                  htmlFor="founderStories"
                  hint="One per line. Especially the expensive mistakes — first-person failure consistently outperforms."
                >
                  <Textarea
                    id="founderStories"
                    rows={5}
                    value={lines("founderStories")}
                    onChange={(e) => setLines("founderStories", e.target.value)}
                  />
                </Field>
              </>
            ) : null}

            {step === "voice" ? (
              <>
                <Field
                  label="How do you sound?"
                  htmlFor="voiceTone"
                  hint="Be specific. 'Direct and unsentimental, never motivational' is useful. 'Professional' is not."
                  error={errors.voiceTone}
                >
                  <Textarea
                    id="voiceTone"
                    rows={4}
                    value={data.voiceTone ?? ""}
                    onChange={(e) => set("voiceTone", e.target.value)}
                    autoFocus
                  />
                </Field>
                <Field
                  label="Phrases you actually use"
                  htmlFor="voicePhrasesUsed"
                  hint="One per line."
                >
                  <Textarea
                    id="voicePhrasesUsed"
                    rows={4}
                    value={lines("voicePhrasesUsed")}
                    onChange={(e) => setLines("voicePhrasesUsed", e.target.value)}
                  />
                </Field>
                <Field
                  label="Words and phrases you never use"
                  htmlFor="voicePhrasesAvoided"
                  hint="One per line."
                >
                  <Textarea
                    id="voicePhrasesAvoided"
                    rows={4}
                    value={lines("voicePhrasesAvoided")}
                    onChange={(e) => setLines("voicePhrasesAvoided", e.target.value)}
                    placeholder={"game-changing\ncrushing it\nlet that sink in"}
                  />
                </Field>
                <div className="rounded-lg border border-accent-line bg-accent-soft p-4">
                  <p className="text-[13px] font-medium text-ink">
                    This next part matters more than everything else on this page
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                    Paste real sentences. Not descriptions of how you sound — actual things you have
                    written or said. Three good examples here do more than a page of adjectives.
                  </p>
                  <div className="mt-4 space-y-5">
                    <Field label="Sounds exactly like me" htmlFor="voiceSoundsLikeMe">
                      <Textarea
                        id="voiceSoundsLikeMe"
                        rows={5}
                        value={lines("voiceSoundsLikeMe")}
                        onChange={(e) => setLines("voiceSoundsLikeMe", e.target.value)}
                        placeholder="One sentence per line"
                      />
                    </Field>
                    <Field label="Does not sound like me at all" htmlFor="voiceNotMe">
                      <Textarea
                        id="voiceNotMe"
                        rows={4}
                        value={lines("voiceNotMe")}
                        onChange={(e) => setLines("voiceNotMe", e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              </>
            ) : null}

            {step === "content" ? (
              <>
                <Field
                  label="Your best-performing content"
                  htmlFor="bestContent"
                  hint="One per line — a title, a topic or a link. Your own history is better evidence than any general best practice."
                  optional
                >
                  <Textarea
                    id="bestContent"
                    rows={5}
                    value={lines("bestContent")}
                    onChange={(e) => setLines("bestContent", e.target.value)}
                    autoFocus
                  />
                </Field>
                <Field
                  label="What has fallen flat"
                  htmlFor="worstContent"
                  hint="One per line. Negative evidence is genuinely useful."
                  optional
                >
                  <Textarea
                    id="worstContent"
                    rows={4}
                    value={lines("worstContent")}
                    onChange={(e) => setLines("worstContent", e.target.value)}
                  />
                </Field>
                <Field
                  label="Content by others that you admire"
                  htmlFor="admiredContent"
                  hint="One per line."
                  optional
                >
                  <Textarea
                    id="admiredContent"
                    rows={4}
                    value={lines("admiredContent")}
                    onChange={(e) => setLines("admiredContent", e.target.value)}
                  />
                </Field>
              </>
            ) : null}

            {step === "market" ? (
              <>
                <Field
                  label="Competitors"
                  htmlFor="competitors"
                  hint="One per line. Direct competitors and adjacent voices both matter."
                  optional
                >
                  <Textarea
                    id="competitors"
                    rows={5}
                    value={lines("competitors")}
                    onChange={(e) => setLines("competitors", e.target.value)}
                    autoFocus
                  />
                </Field>
                <Field
                  label="Accounts your customers already follow"
                  htmlFor="monitoredAccounts"
                  hint="One per line."
                  optional
                >
                  <Textarea
                    id="monitoredAccounts"
                    rows={4}
                    value={lines("monitoredAccounts")}
                    onChange={(e) => setLines("monitoredAccounts", e.target.value)}
                  />
                </Field>
                <Field
                  label="Questions you get asked repeatedly"
                  htmlFor="customerQuestions"
                  hint="One per line. These become content directly."
                  optional
                >
                  <Textarea
                    id="customerQuestions"
                    rows={5}
                    value={lines("customerQuestions")}
                    onChange={(e) => setLines("customerQuestions", e.target.value)}
                  />
                </Field>
              </>
            ) : null}

            {step === "operation" ? (
              <>
                <p className="text-[13px] text-muted">Who does each of these today?</p>
                <div className="grid gap-5 sm:grid-cols-2">
                  {(
                    [
                      ["whoResearches", "Research"],
                      ["whoIdeates", "Ideas"],
                      ["whoScripts", "Scripting"],
                      ["whoRecords", "Recording"],
                      ["whoEdits", "Editing"],
                      ["whoApproves", "Approval"],
                      ["whoPublishes", "Publishing"],
                      ["whoAnalyses", "Analysis"],
                    ] as const
                  ).map(([key, label]) => (
                    <Field key={key} label={label} htmlFor={key}>
                      <Input
                        id={key}
                        value={(data[key] as string) ?? ""}
                        onChange={(e) => set(key, e.target.value)}
                        placeholder="Me / a contractor / nobody"
                      />
                    </Field>
                  ))}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Founder hours per week on content"
                    htmlFor="hoursPerWeek"
                    hint="Honestly. Including the time you spend thinking about it."
                    error={errors.hoursPerWeek}
                  >
                    <Input
                      id="hoursPerWeek"
                      type="number"
                      min={0}
                      max={168}
                      value={data.hoursPerWeek ?? ""}
                      onChange={(e) => set("hoursPerWeek", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="People involved" htmlFor="peopleInvolved" optional>
                    <Input
                      id="peopleInvolved"
                      type="number"
                      min={0}
                      value={data.peopleInvolved ?? ""}
                      onChange={(e) => set("peopleInvolved", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Monthly spend on content" htmlFor="monthlySpend" optional>
                    <Input
                      id="monthlySpend"
                      type="number"
                      min={0}
                      value={data.monthlySpend ?? ""}
                      onChange={(e) => set("monthlySpend", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Pieces published per 4-week period" htmlFor="monthlyOutput" optional>
                    <Input
                      id="monthlyOutput"
                      type="number"
                      min={0}
                      value={data.monthlyOutput ?? ""}
                      onChange={(e) => set("monthlyOutput", Number(e.target.value))}
                    />
                  </Field>
                </div>
              </>
            ) : null}

            {step === "goals" ? (
              <>
                <Field
                  label="Which platforms matter?"
                  htmlFor="targetPlatforms"
                  error={errors.targetPlatforms}
                >
                  <div className="flex flex-wrap gap-2">
                    {PLATFORM_OPTIONS.map((option) => {
                      const selected = (data.targetPlatforms ?? []).includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            set(
                              "targetPlatforms",
                              selected
                                ? (data.targetPlatforms ?? []).filter((p) => p !== option.value)
                                : [...(data.targetPlatforms ?? []), option.value],
                            )
                          }
                          className={cn(
                            "inline-flex h-9 items-center rounded-md border px-3.5 text-[13px] transition-colors",
                            selected
                              ? "border-accent-line bg-accent-soft text-accent"
                              : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field
                  label="Target pieces per week"
                  htmlFor="targetCadence"
                  hint="What you can actually sustain. The weekly report measures against this."
                  error={errors.targetCadence}
                >
                  <Input
                    id="targetCadence"
                    type="number"
                    min={0}
                    max={50}
                    value={data.targetCadence ?? ""}
                    onChange={(e) => set("targetCadence", Number(e.target.value))}
                  />
                </Field>

                <Field
                  label="What should this achieve for the business?"
                  htmlFor="businessObjectives"
                  hint="One per line."
                >
                  <Textarea
                    id="businessObjectives"
                    rows={4}
                    value={lines("businessObjectives")}
                    onChange={(e) => setLines("businessObjectives", e.target.value)}
                  />
                </Field>

                <Field
                  label="Anything we must never publish about"
                  htmlFor="bannedTopics"
                  hint="One per line. Absolute — the system will not generate against these."
                  optional
                >
                  <Textarea
                    id="bannedTopics"
                    rows={3}
                    value={lines("bannedTopics")}
                    onChange={(e) => setLines("bannedTopics", e.target.value)}
                  />
                </Field>

                <Field label="Compliance notes" htmlFor="complianceNotes" optional>
                  <Textarea
                    id="complianceNotes"
                    rows={3}
                    value={data.complianceNotes ?? ""}
                    onChange={(e) => set("complianceNotes", e.target.value)}
                  />
                </Field>
              </>
            ) : null}

            {step === "commercial" ? (
              <>
                <Field
                  label="How does attention become an inquiry today?"
                  htmlFor="attentionToInquiry"
                  hint="Walk through what actually happens. If the honest answer is 'it does not', say that — it is the most useful answer on this page."
                  error={errors.attentionToInquiry}
                >
                  <Textarea
                    id="attentionToInquiry"
                    rows={5}
                    value={data.attentionToInquiry ?? ""}
                    onChange={(e) => set("attentionToInquiry", e.target.value)}
                    autoFocus
                  />
                </Field>
                <Field
                  label="Lead magnets or resources you offer"
                  htmlFor="leadMagnets"
                  hint="One per line."
                  optional
                >
                  <Textarea
                    id="leadMagnets"
                    rows={3}
                    value={lines("leadMagnets")}
                    onChange={(e) => setLines("leadMagnets", e.target.value)}
                  />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Booking link" htmlFor="bookingUrl" optional>
                    <Input
                      id="bookingUrl"
                      value={data.bookingUrl ?? ""}
                      onChange={(e) => set("bookingUrl", e.target.value)}
                      placeholder="https://"
                    />
                  </Field>
                  <Field label="Average deal value" htmlFor="averageDealValue" optional>
                    <Input
                      id="averageDealValue"
                      type="number"
                      min={0}
                      value={data.averageDealValue ?? ""}
                      onChange={(e) => set("averageDealValue", Number(e.target.value))}
                    />
                  </Field>
                </div>
              </>
            ) : null}

            {step === "integrations" ? (
              <>
                <Notice tone="neutral" title="We only ask for access we can actually use">
                  Most publishing and analytics platforms require credentials or approval that only
                  you can obtain. Threadline does not ask you to paste API keys into a form. Where a
                  connection is not possible, there is a manual workflow that works today — and your
                  operator will set it up with you.
                </Notice>
                <Field
                  label="Anything you would like connected eventually"
                  htmlFor="requestedIntegrations"
                  hint="One per line. This shapes what we prioritise."
                  optional
                >
                  <Textarea
                    id="requestedIntegrations"
                    rows={4}
                    value={lines("requestedIntegrations")}
                    onChange={(e) => setLines("requestedIntegrations", e.target.value)}
                  />
                </Field>
                <Field label="Anything else we should know" htmlFor="integrationNotes" optional>
                  <Textarea
                    id="integrationNotes"
                    rows={3}
                    value={data.integrationNotes ?? ""}
                    onChange={(e) => set("integrationNotes", e.target.value)}
                  />
                </Field>
              </>
            ) : null}

            {step === "review" ? <ReviewStep data={data} onEdit={jumpTo} /> : null}

            {step === "build" ? <BuildStep slug={slug} onDone={() => setStep("done")} /> : null}

            {step === "done" ? (
              <DoneStep slug={slug} orgName={orgName} onOpen={() => router.push(`/app/${slug}`)} />
            ) : null}
          </div>

          {/* -------------------------------- Footer -------------------------------- */}
          {step !== "build" && step !== "done" ? (
            <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
              <Button
                variant="ghost"
                icon={ArrowLeft}
                disabled={index === 0 || pending}
                onClick={goBack}
              >
                Back
              </Button>

              <div className="flex items-center gap-3">
                <span className="hidden text-[11.5px] text-ghost sm:inline">
                  Step {index + 1} of {ONBOARDING_STEPS.length - 2}
                </span>
                <Button
                  variant={step === "review" ? "accent" : "primary"}
                  iconRight={ArrowRight}
                  loading={pending}
                  onClick={advance}
                >
                  {step === "welcome"
                    ? "Begin"
                    : step === "review"
                      ? "Build my workspace"
                      : "Continue"}
                </Button>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

/* --------------------------------- Steps ---------------------------------- */

function WelcomeStep({ founderName, orgName }: { founderName: string; orgName: string }) {
  const firstName = founderName.split(" ")[0] ?? founderName;
  return (
    <div className="space-y-6">
      <p className="text-[15px] leading-relaxed text-muted">
        {firstName}, this is the part that determines whether Threadline sounds like{" "}
        {orgName} or like everyone else. It takes about{" "}
        <span className="text-ink">{minutes(totalEstimateMinutes())}</span>, it saves as you go, and
        you can stop and come back at any point.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            title: "Your business",
            body: "What you sell, who buys it, and what makes them buy.",
          },
          {
            title: "Your voice",
            body: "How you actually sound, in your own sentences.",
          },
          {
            title: "Your operation",
            body: "How content gets made today, so we can measure the change.",
          },
        ].map((block) => (
          <div key={block.title} className="rounded-lg border border-line bg-elevated p-4">
            <p className="text-[13px] font-medium text-ink">{block.title}</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{block.body}</p>
          </div>
        ))}
      </div>

      <Notice tone="neutral" title="What happens at the end">
        Your answers are not filed away. They are written straight into the Brand Brain, used to
        seed your research workspace, and used to generate your first set of content
        opportunities — so the workspace you land in is already populated.
      </Notice>

      <p className="flex items-center gap-2 text-[12.5px] text-ghost">
        <Clock className="size-3.5" aria-hidden />
        Roughly {minutes(totalEstimateMinutes())}, saved automatically.
      </p>
    </div>
  );
}

function ReviewStep({
  data,
  onEdit,
}: {
  data: OnboardingData;
  onEdit: (step: string) => void;
}) {
  const sections: { step: string; title: string; rows: { label: string; value: string }[] }[] = [
    {
      step: "business",
      title: "Business",
      rows: [
        { label: "Company", value: data.companyName ?? "—" },
        { label: "What it does", value: data.description ?? "—" },
        { label: "Website", value: data.website ?? "—" },
      ],
    },
    {
      step: "offer",
      title: "Offer",
      rows: [
        { label: "Offer", value: data.offerName ?? "—" },
        { label: "Outcome", value: data.offerOutcome ?? "—" },
        { label: "Mechanism", value: data.offerMechanism ?? "—" },
        { label: "CTAs", value: (data.offerCtas ?? []).join(" · ") || "—" },
      ],
    },
    {
      step: "customer",
      title: "Customer",
      rows: [
        { label: "Audience", value: data.icpName ?? "—" },
        { label: "Pains", value: (data.icpPains ?? []).join(" · ") || "—" },
        { label: "Objections", value: (data.icpObjections ?? []).join(" · ") || "—" },
      ],
    },
    {
      step: "founder",
      title: "Founder",
      rows: [
        { label: "Name", value: data.founderName ?? "—" },
        { label: "Background", value: data.founderBio ?? "—" },
        { label: "Beliefs", value: (data.founderBeliefs ?? []).join(" · ") || "—" },
        { label: "Stories", value: (data.founderStories ?? []).join(" · ") || "—" },
      ],
    },
    {
      step: "voice",
      title: "Voice",
      rows: [
        { label: "Tone", value: data.voiceTone ?? "—" },
        { label: "Sounds like me", value: (data.voiceSoundsLikeMe ?? []).join(" · ") || "—" },
        { label: "Never use", value: (data.voicePhrasesAvoided ?? []).join(" · ") || "—" },
      ],
    },
    {
      step: "operation",
      title: "Current operation",
      rows: [
        { label: "Founder hours per week", value: String(data.hoursPerWeek ?? "—") },
        { label: "Pieces per 4-week period", value: String(data.monthlyOutput ?? "—") },
      ],
    },
    {
      step: "goals",
      title: "Goals",
      rows: [
        { label: "Platforms", value: (data.targetPlatforms ?? []).join(", ") || "—" },
        { label: "Cadence", value: `${data.targetCadence ?? "—"} per week` },
        { label: "Banned topics", value: (data.bannedTopics ?? []).join(" · ") || "None" },
      ],
    },
    {
      step: "commercial",
      title: "Commercial path",
      rows: [{ label: "Attention to inquiry", value: data.attentionToInquiry ?? "—" }],
    },
  ];

  return (
    <div className="space-y-4">
      <Notice tone="neutral">
        Check this over. Anything here can still be edited, and everything remains editable in the
        Brand Brain afterwards.
      </Notice>

      {sections.map((section) => (
        <div key={section.step} className="rounded-lg border border-line bg-elevated">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
            <h2 className="text-[13px] font-medium text-ink">{section.title}</h2>
            <Button size="xs" variant="ghost" icon={Pencil} onClick={() => onEdit(section.step)}>
              Edit
            </Button>
          </div>
          <dl className="divide-y divide-line">
            {section.rows.map((row) => (
              <div key={row.label} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:gap-6">
                <dt className="w-44 shrink-0 text-[12px] text-faint">{row.label}</dt>
                <dd className="min-w-0 flex-1 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

const BUILD_STAGES = [
  "Writing your Brand Brain",
  "Recording your offer and audience",
  "Seeding your research workspace",
  "Generating your first content opportunities",
  "Setting up your workflow",
];

function BuildStep({ slug, onDone }: { slug: string; onDone: () => void }) {
  const router = useRouter();
  const [stage, setStage] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{ ideas: number; research: number } | null>(null);
  const started = React.useRef(false);

  React.useEffect(() => {
    if (started.current) return;
    started.current = true;

    // The stage ticker is presentational, but the work behind it is real and the
    // screen does not advance until the server actually finishes.
    const ticker = setInterval(() => {
      setStage((s) => Math.min(s + 1, BUILD_STAGES.length - 1));
    }, 1400);

    void (async () => {
      const response = await buildWorkspaceAction(slug);
      clearInterval(ticker);
      if (response.ok) {
        setStage(BUILD_STAGES.length);
        setResult({ ideas: response.data.ideas, research: response.data.research });
        setTimeout(() => {
          onDone();
          router.refresh();
        }, 900);
      } else {
        setError(response.error);
      }
    })();

    return () => clearInterval(ticker);
  }, [slug, onDone, router]);

  if (error) {
    return (
      <div className="space-y-4">
        <Notice tone="warning" title="The build did not complete">
          {error}
        </Notice>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8 flex justify-center">
        <ThreadMark size={48} className="text-accent" animated />
      </div>

      <ol className="mx-auto max-w-md space-y-3">
        {BUILD_STAGES.map((label, i) => {
          const done = i < stage;
          const active = i === stage;
          return (
            <li
              key={label}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
                done
                  ? "border-positive/25 bg-positive-soft"
                  : active
                    ? "border-accent-line bg-accent-soft"
                    : "border-line bg-surface",
              )}
            >
              {done ? (
                <CheckCircle2 className="size-4 shrink-0 text-positive" aria-hidden />
              ) : active ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-accent" aria-hidden />
              ) : (
                <Circle className="size-4 shrink-0 text-ghost" aria-hidden />
              )}
              <span
                className={cn(
                  "text-[13px]",
                  done ? "text-muted" : active ? "text-ink" : "text-ghost",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      {result ? (
        <p className="mt-8 text-center text-[13px] text-muted">
          {result.ideas} content opportunities and {result.research} research items created.
        </p>
      ) : null}
    </div>
  );
}

function DoneStep({
  slug,
  orgName,
  onOpen,
}: {
  slug: string;
  orgName: string;
  onOpen: () => void;
}) {
  return (
    <div className="py-6 text-center">
      <div className="mb-6 flex justify-center">
        <span className="grid size-14 place-items-center rounded-full border border-accent-line bg-accent-soft">
          <Check className="size-6 text-accent" aria-hidden />
        </span>
      </div>
      <h2 className="text-hero">Your operating system is installed</h2>
      <p className="mx-auto mt-4 max-w-lg text-[14.5px] leading-relaxed text-muted">
        {orgName}&apos;s Brand Brain is written, your research workspace is seeded, and your first
        content opportunities are waiting. Your operator will be in touch to run the first cycle
        with you.
      </p>
      <div className="mt-8 flex justify-center">
        <Button size="lg" variant="accent" iconRight={ArrowRight} onClick={onOpen}>
          Open your command centre
        </Button>
      </div>
      <p className="mt-4 text-[12px] text-ghost">
        Everything you entered stays editable in the Brand Brain.
      </p>
      <input type="hidden" value={slug} readOnly />
    </div>
  );
}
