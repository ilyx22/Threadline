"use client";

import * as React from "react";
import { useActionState } from "react";
import { ArrowLeft, ArrowRight, CalendarCheck, Check, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/controls";
import { Notice } from "@/components/ui/feedback";
import { submitApplicationAction } from "@/lib/actions/application";
import { APPLICATION_OPTIONS, APPLICATION_STEPS } from "@/lib/domain/application";
import type { ActionResult } from "@/lib/actions/shared";

/**
 * Application form.
 *
 * Three steps rather than one long page. Step validation is client-side for
 * responsiveness; the server re-validates everything on submit, since a client
 * check is a convenience and never a control.
 */
export function ApplicationForm({ bookingUrl }: { bookingUrl: string | null }) {
  const [state, formAction, pending] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(submitApplicationAction, null);

  const [step, setStep] = React.useState(0);
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [platforms, setPlatforms] = React.useState<string[]>([]);
  const [localErrors, setLocalErrors] = React.useState<Record<string, string>>({});

  const set = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setLocalErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const meta = APPLICATION_STEPS[step]!;
  const serverErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const errors = { ...serverErrors, ...localErrors };

  const REQUIRED: Record<string, string> = {
    name: "Enter your name.",
    email: "Enter a valid email address.",
    company: "Enter your company.",
    whatYouSell: "Tell us what you sell.",
    revenueRange: "Choose a range.",
    contentProcess: "Describe how content gets made today.",
    peopleInvolved: "Choose an option.",
    publishCadence: "Choose an option.",
    founderHours: "Choose an option.",
    biggestBottleneck: "What is the biggest bottleneck?",
    successLooksLike: "Describe what success looks like.",
    urgency: "Choose an option.",
  };

  const validateStep = () => {
    const next: Record<string, string> = {};
    for (const field of meta.fields) {
      const message = REQUIRED[field];
      if (!message) continue;
      const value = (values[field] ?? "").trim();
      if (!value) next[field] = message;
      if (field === "email" && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
        next[field] = "Enter a valid email address.";
      }
      if (field === "whatYouSell" && value && value.length < 10) {
        next[field] = "A little more detail, please.";
      }
    }
    setLocalErrors(next);
    return Object.keys(next).length === 0;
  };

  const advance = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, APPLICATION_STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ------------------------------ Success screen ----------------------------- */
  if (state?.ok) {
    return (
      <Card>
        <CardBody className="py-10 text-center">
          <div className="mx-auto mb-6 grid size-12 place-items-center rounded-full border border-positive/30 bg-positive-soft">
            <CheckCircle2 className="size-6 text-positive" aria-hidden />
          </div>
          <h2 className="text-[19px] font-medium text-ink">Application received</h2>
          <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted">
            A person reads every application, usually within one working day. You will get a reply
            either way — including if we do not think we are the right fit, and why.
          </p>

          {bookingUrl ? (
            <div className="mx-auto mt-8 max-w-md rounded-lg border border-accent-line bg-accent-soft p-5">
              <p className="text-[13.5px] font-medium text-ink">
                Want to skip the wait?
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Book the diagnostic call now. If your application does not qualify, we will let you
                know before the call and release the slot.
              </p>
              <ButtonLink
                href={bookingUrl}
                variant="accent"
                icon={CalendarCheck}
                className="mt-4"
                target="_blank"
                rel="noreferrer noopener"
              >
                Book a call
              </ButtonLink>
            </div>
          ) : (
            <div className="mx-auto mt-8 max-w-md rounded-lg border border-line bg-surface p-5">
              <p className="text-[13px] leading-relaxed text-muted">
                We will email you to arrange a time. No booking link is configured on this
                installation, so scheduling happens by email rather than through an automated
                calendar.
              </p>
            </div>
          )}

          <ButtonLink href="/" variant="ghost" className="mt-8">
            Back to the homepage
          </ButtonLink>
        </CardBody>
      </Card>
    );
  }

  return (
    <form action={formAction}>
      {/* Every answer is submitted, not just the visible step. */}
      {Object.entries(values).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      {platforms.map((platform) => (
        <input key={platform} type="hidden" name="platforms" value={platform} />
      ))}

      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-eyebrow text-faint">
            Step {step + 1} of {APPLICATION_STEPS.length} · {meta.title}
          </p>
          <span className="text-[11.5px] tabular text-ghost">
            {Math.round(((step + 1) / APPLICATION_STEPS.length) * 100)}%
          </span>
        </div>
        <Progress value={((step + 1) / APPLICATION_STEPS.length) * 100} />
      </div>

      <Card>
        <CardBody className="space-y-5 pt-6">
          <div>
            <h2 className="text-[17px] font-medium text-ink">{meta.title}</h2>
            <p className="mt-1.5 text-[13.5px] text-muted">{meta.description}</p>
          </div>

          {state && !state.ok && !state.fieldErrors ? (
            <Notice tone="warning" title="That did not send">
              {state.error}
            </Notice>
          ) : null}

          {/* ------------------------------- Step 1 ------------------------------- */}
          {step === 0 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Your name" htmlFor="name" error={errors.name}>
                  <Input
                    id="name"
                    value={values.name ?? ""}
                    onChange={(e) => set("name", e.target.value)}
                    autoFocus
                  />
                </Field>
                <Field label="Email" htmlFor="email" error={errors.email}>
                  <Input
                    id="email"
                    type="email"
                    value={values.email ?? ""}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </Field>
                <Field label="Company" htmlFor="company" error={errors.company}>
                  <Input
                    id="company"
                    value={values.company ?? ""}
                    onChange={(e) => set("company", e.target.value)}
                  />
                </Field>
                <Field label="Website" htmlFor="website" optional>
                  <Input
                    id="website"
                    value={values.website ?? ""}
                    onChange={(e) => set("website", e.target.value)}
                    placeholder="https://"
                  />
                </Field>
              </div>

              <Field label="What do you sell?" htmlFor="whatYouSell" error={errors.whatYouSell}>
                <Textarea
                  id="whatYouSell"
                  rows={4}
                  value={values.whatYouSell ?? ""}
                  onChange={(e) => set("whatYouSell", e.target.value)}
                  placeholder="The offer, roughly what it costs, and who buys it."
                />
              </Field>

              <Field
                label="Approximate annual revenue"
                htmlFor="revenueRange"
                error={errors.revenueRange}
              >
                <NativeSelect
                  id="revenueRange"
                  value={values.revenueRange ?? ""}
                  onChange={(e) => set("revenueRange", e.target.value)}
                >
                  <option value="">Choose one</option>
                  {APPLICATION_OPTIONS.revenueRange.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </>
          ) : null}

          {/* ------------------------------- Step 2 ------------------------------- */}
          {step === 1 ? (
            <>
              <Field
                label="How does content currently get made?"
                htmlFor="contentProcess"
                hint="Walk through the last thing you published, start to finish."
                error={errors.contentProcess}
              >
                <Textarea
                  id="contentProcess"
                  rows={5}
                  value={values.contentProcess ?? ""}
                  onChange={(e) => set("contentProcess", e.target.value)}
                  autoFocus
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="How many people touch content?"
                  htmlFor="peopleInvolved"
                  error={errors.peopleInvolved}
                >
                  <NativeSelect
                    id="peopleInvolved"
                    value={values.peopleInvolved ?? ""}
                    onChange={(e) => set("peopleInvolved", e.target.value)}
                  >
                    <option value="">Choose one</option>
                    {APPLICATION_OPTIONS.peopleInvolved.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>

                <Field
                  label="How often do you publish?"
                  htmlFor="publishCadence"
                  error={errors.publishCadence}
                >
                  <NativeSelect
                    id="publishCadence"
                    value={values.publishCadence ?? ""}
                    onChange={(e) => set("publishCadence", e.target.value)}
                  >
                    <option value="">Choose one</option>
                    {APPLICATION_OPTIONS.publishCadence.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>

                <Field
                  label="Founder hours per week on content"
                  htmlFor="founderHours"
                  error={errors.founderHours}
                  className="sm:col-span-2"
                >
                  <NativeSelect
                    id="founderHours"
                    value={values.founderHours ?? ""}
                    onChange={(e) => set("founderHours", e.target.value)}
                  >
                    <option value="">Choose one</option>
                    {APPLICATION_OPTIONS.founderHours.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>

              <Field label="Which platforms matter?" htmlFor="platforms" optional>
                <div className="flex flex-wrap gap-2">
                  {APPLICATION_OPTIONS.platforms.map((platform) => {
                    const selected = platforms.includes(platform);
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() =>
                          setPlatforms((prev) =>
                            selected ? prev.filter((p) => p !== platform) : [...prev, platform],
                          )
                        }
                        className={cn(
                          "inline-flex h-9 items-center gap-1.5 rounded-md border px-3.5 text-[13px] transition-colors",
                          selected
                            ? "border-accent-line bg-accent-soft text-accent"
                            : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
                        )}
                      >
                        {selected ? <Check className="size-3" aria-hidden /> : null}
                        {platform}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </>
          ) : null}

          {/* ------------------------------- Step 3 ------------------------------- */}
          {step === 2 ? (
            <>
              <Field
                label="What is the biggest bottleneck?"
                htmlFor="biggestBottleneck"
                hint="Be blunt. If the answer is you, say that."
                error={errors.biggestBottleneck}
              >
                <Textarea
                  id="biggestBottleneck"
                  rows={4}
                  value={values.biggestBottleneck ?? ""}
                  onChange={(e) => set("biggestBottleneck", e.target.value)}
                  autoFocus
                />
              </Field>

              <Field
                label="What would a successful content operation look like?"
                htmlFor="successLooksLike"
                hint="Twelve months from now, what has changed?"
                error={errors.successLooksLike}
              >
                <Textarea
                  id="successLooksLike"
                  rows={4}
                  value={values.successLooksLike ?? ""}
                  onChange={(e) => set("successLooksLike", e.target.value)}
                />
              </Field>

              <Field
                label="Are you looking to solve this now?"
                htmlFor="urgency"
                error={errors.urgency}
              >
                <NativeSelect
                  id="urgency"
                  value={values.urgency ?? ""}
                  onChange={(e) => set("urgency", e.target.value)}
                >
                  <option value="">Choose one</option>
                  {APPLICATION_OPTIONS.urgency.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              <Field label="Anything else we should know?" htmlFor="extra" optional>
                <Textarea
                  id="extra"
                  rows={3}
                  value={values.extra ?? ""}
                  onChange={(e) => set("extra", e.target.value)}
                />
              </Field>

              <Notice tone="neutral">
                We do not sell your details, add you to a sequence, or share them with anyone. A
                person reads this and replies.
              </Notice>
            </>
          ) : null}
        </CardBody>
      </Card>

      <div className="mt-6 flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          icon={ArrowLeft}
          disabled={step === 0 || pending}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </Button>

        {step < APPLICATION_STEPS.length - 1 ? (
          <Button variant="primary" iconRight={ArrowRight} onClick={advance}>
            Continue
          </Button>
        ) : (
          <Button
            type="submit"
            variant="accent"
            size="lg"
            loading={pending}
            onClick={(e) => {
              if (!validateStep()) e.preventDefault();
            }}
          >
            Submit application
          </Button>
        )}
      </div>
    </form>
  );
}
