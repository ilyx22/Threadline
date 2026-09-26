"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
import { CheckboxField } from "@/components/ui/controls";
import { Notice } from "@/components/ui/feedback";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { createClientAction } from "@/lib/actions/admin";
import { PACKAGE_TIER_OPTIONS } from "@/lib/domain/enums";

/**
 * Client creation.
 *
 * Deliberately asks for the minimum: everything else is captured during
 * onboarding by the founder, in their own words, which produces far better
 * context than an operator filling in a form on their behalf.
 */
export function NewClientForm({ defaultCadence }: { defaultCadence: number }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [seedTemplate, setSeedTemplate] = React.useState(true);
  const [created, setCreated] = React.useState<{ slug: string; inviteLink: string } | null>(null);

  // Suggest a slug from the name until the operator edits it themselves.
  React.useEffect(() => {
    if (slugTouched) return;
    setSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40),
    );
  }, [name, slugTouched]);

  if (created) {
    return (
      <Card>
        <CardHeader title="Client created" eyebrow="Founder invitation" />
        <CardBody className="space-y-4 pt-0">
          <p className="text-[13px] text-muted">
            Email is not configured on this deployment, so send the founder this invitation link yourself. It works once and expires in seven days; they choose their own password.
          </p>
          <code className="block break-all rounded-md border border-line px-3 py-2 text-[12px] text-ink">{created.inviteLink}</code>
          <a href={`/app/${created.slug}`} className="inline-flex min-h-11 items-center text-accent">Open the workspace</a>
        </CardBody>
      </Card>
    );
  }

  return (
    <ActionForm<{ slug: string; inviteLink: string | null }>
      action={createClientAction}
      onSuccess={(data) => (data.inviteLink ? setCreated({ slug: data.slug, inviteLink: data.inviteLink }) : router.push(`/app/${data.slug}`))}
    >
      {({ fieldErrors, error }) => (
        <Card>
          <CardHeader title="Client details" eyebrow="Step 1" />
          <CardBody className="space-y-5 pt-0">
            <FormError error={error} />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Company name" htmlFor="name" error={fieldErrors.name}>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </Field>
              <Field
                label="Workspace slug"
                htmlFor="slug"
                hint="Appears in the URL. Lowercase letters, numbers and hyphens."
                error={fieldErrors.slug}
              >
                <Input
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  required
                  pattern="[a-z0-9\-]+"
                />
              </Field>
              <Field label="Website" htmlFor="website" optional>
                <Input id="website" name="website" placeholder="https://" />
              </Field>
              <Field label="Industry" htmlFor="industry" optional>
                <Input id="industry" name="industry" />
              </Field>
              <Field label="Geography" htmlFor="geography" optional>
                <Input id="geography" name="geography" />
              </Field>
              <Field label="Currency" htmlFor="currency">
                <NativeSelect id="currency" name="currency" defaultValue="GBP">
                  <option value="GBP">GBP (£)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </NativeSelect>
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Package" htmlFor="packageTier">
                <NativeSelect id="packageTier" name="packageTier" defaultValue="install">
                  {PACKAGE_TIER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Setup fee" htmlFor="setupFee" optional>
                <Input id="setupFee" name="setupFee" type="number" min={0} step="0.01" />
              </Field>
              <Field label="Fee per 4-week period" htmlFor="periodFee" optional>
                <Input id="periodFee" name="periodFee" type="number" min={0} step="0.01" />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Target cadence"
                htmlFor="cadencePerWeek"
                hint="Pieces per week. The founder can change this during onboarding."
              >
                <Input
                  id="cadencePerWeek"
                  name="cadencePerWeek"
                  type="number"
                  min={0}
                  max={50}
                  defaultValue={defaultCadence}
                />
              </Field>
              <Field
                label="Platforms"
                htmlFor="platforms"
                hint="Comma separated. Defaults to the master template."
                optional
              >
                <Input id="platforms" name="platforms" placeholder="linkedin, youtube_shorts" />
              </Field>
            </div>

            <div className="border-t border-line pt-5">
              <p className="text-[13px] font-medium text-ink">Founder</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
                The founder is invited by email and chooses their own password. They become the
                workspace owner when they accept.
              </p>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <Field label="Founder name" htmlFor="founderName" error={fieldErrors.founderName}>
                  <Input id="founderName" name="founderName" required />
                </Field>
                <Field label="Founder email" htmlFor="founderEmail" error={fieldErrors.founderEmail}>
                  <Input id="founderEmail" name="founderEmail" type="email" required />
                </Field>
              </div>
            </div>

            <CheckboxField
              id="seedTemplate"
              name="seedTemplate"
              value="on"
              label="Scaffold from the master template"
              description="Creates integration rows, destination labels and the standard first tasks. Leave this on unless you have a reason not to."
              checked={seedTemplate}
              onCheckedChange={(checked) => setSeedTemplate(checked === true)}
            />
            {seedTemplate ? <input type="hidden" name="seedTemplate" value="on" /> : null}

            <Notice tone="neutral">
              After creating the client, send the founder to their onboarding. It writes the Brand
              Brain, seeds research and generates their first content opportunities.
            </Notice>
          </CardBody>
          <CardFooter>
            <span className="text-[12px] text-faint">
              The workspace opens once created.
            </span>
            <SubmitButton variant="accent" icon={Building2} pendingLabel="Creating…">
              Create client
            </SubmitButton>
          </CardFooter>
        </Card>
      )}
    </ActionForm>
  );
}
