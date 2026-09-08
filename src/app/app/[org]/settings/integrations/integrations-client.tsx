"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, Info, Plus, Settings2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge, Pill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/feedback";
import { IntegrationStatusBadge } from "@/components/ui/status";
import { ActionButton, ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { IMPLEMENTATION_META } from "@/lib/integrations/registry";
import { ACCESS_METHOD_META, type AccessMethod } from "@/lib/domain/enums";
import {
  createSocialAccountAction,
  deleteSocialAccountAction,
  disableIntegrationAction,
  saveIntegrationAction,
} from "@/lib/actions/distribution";
import { PLATFORM_META, PLATFORM_OPTIONS, metaOf } from "@/lib/domain/enums";
import { formatDate } from "@/lib/utils/dates";

type IntegrationView = {
  provider: string;
  name: string;
  category: string;
  summary: string;
  capabilities: string[];
  implementation: "available" | "adapter_only" | "manual_only";
  /** How publishing actually happens for this client, today. */
  accessMethod: string;
  accessOptions: string[];
  blockedReason: string | null;
  manualFallback: string;
  configFields: {
    key: string;
    label: string;
    placeholder: string | null;
    hint: string | null;
    type: string;
  }[];
  status: string;
  config: Record<string, unknown>;
  connectedAt: string | null;
  notes: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  publishing: "Publishing",
  analytics: "Analytics",
  storage: "Storage",
  crm: "CRM",
  scheduling: "Scheduling",
  payments: "Payments",
};

export function IntegrationList({
  slug,
  integrations,
  canEdit,
}: {
  slug: string;
  integrations: IntegrationView[];
  canEdit: boolean;
}) {
  const [configuring, setConfiguring] = React.useState<IntegrationView | null>(null);

  const grouped = integrations.reduce<Record<string, IntegrationView[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <>
      <div className="space-y-8">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category}>
            <h2 className="text-eyebrow mb-3 text-faint">
              {CATEGORY_LABELS[category] ?? category}
            </h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {items.map((integration) => {
                const meta = IMPLEMENTATION_META[integration.implementation];
                const isAvailable = integration.implementation === "available";
                const access = ACCESS_METHOD_META[integration.accessMethod as AccessMethod];
                const isConfigured = integration.status === "configured";

                return (
                  <Card
                    key={integration.provider}
                    className={cn("flex flex-col", isConfigured && "border-positive/25")}
                  >
                    <CardBody className="flex-1 pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[14px] font-medium text-ink">{integration.name}</p>
                          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                            {integration.summary}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <IntegrationStatusBadge status={integration.status} />
                          <Badge
                            tone={
                              meta.tone === "positive"
                                ? "positive"
                                : meta.tone === "warning"
                                  ? "warning"
                                  : "outline"
                            }
                          >
                            {meta.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {integration.capabilities.map((capability) => (
                          <Pill key={capability}>{capability}</Pill>
                        ))}
                      </div>

                      {/*
                        How access actually works, stated separately from status.
                        "Set up" answers whether the setup is finished; this
                        answers what happens when something is published — and
                        keeping them apart is what stops the card implying an API
                        connection that does not exist.
                      */}
                      <div className="mt-3 flex items-start gap-2.5 rounded-md border border-line bg-elevated px-3 py-2.5">
                        <Badge tone={access?.tone ?? "outline"}>
                          {access?.label ?? integration.accessMethod}
                        </Badge>
                        <p className="text-[11.5px] leading-relaxed text-muted">
                          {access?.description}
                        </p>
                      </div>

                      {/* The honesty surface: why it cannot connect, and what to do instead. */}
                      {!isAvailable ? (
                        <div className="mt-4 space-y-2.5 rounded-md border border-line bg-surface p-3">
                          {integration.blockedReason ? (
                            <div className="flex gap-2.5">
                              <Ban className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
                              <p className="text-[12px] leading-relaxed text-muted">
                                {integration.blockedReason}
                              </p>
                            </div>
                          ) : null}
                          <div className="flex gap-2.5">
                            <Info className="mt-0.5 size-3.5 shrink-0 text-info" aria-hidden />
                            <p className="text-[12px] leading-relaxed text-muted">
                              <span className="text-ink">What happens instead: </span>
                              {integration.manualFallback}
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {isConfigured && integration.connectedAt ? (
                        <p className="mt-3 text-[11.5px] text-positive">
                          Configured {formatDate(integration.connectedAt)}
                        </p>
                      ) : null}
                    </CardBody>

                    {canEdit && integration.configFields.length > 0 ? (
                      <div className="flex items-center gap-2 border-t border-line px-5 py-2.5">
                        <Button
                          size="xs"
                          variant={isAvailable ? "secondary" : "ghost"}
                          icon={Settings2}
                          onClick={() => setConfiguring(integration)}
                        >
                          {isConfigured ? "Edit configuration" : "Configure"}
                        </Button>
                        {isConfigured ? (
                          <ActionButton
                            size="xs"
                            variant="ghost"
                            action={() => disableIntegrationAction(slug, integration.provider)}
                            confirm={`Disable ${integration.name}?`}
                          >
                            Disable
                          </ActionButton>
                        ) : null}
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {configuring ? (
        <ConfigureDialog
          slug={slug}
          integration={configuring}
          open
          onOpenChange={(open) => !open && setConfiguring(null)}
        />
      ) : null}
    </>
  );
}

function ConfigureDialog({
  slug,
  integration,
  open,
  onOpenChange,
}: {
  slug: string;
  integration: IntegrationView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const isAvailable = integration.implementation === "available";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader title={`Configure ${integration.name}`} description={integration.summary} />
        <ActionForm
          action={saveIntegrationAction.bind(null, slug, integration.provider)}
          onSuccess={() => {
            onOpenChange(false);
            router.refresh();
          }}
          className="contents"
        >
          {({ error }) => (
            <>
              <DialogBody className="space-y-4">
                <FormError error={error} />

                {!isAvailable ? (
                  <Notice tone="warning" title="This will not create a connection">
                    {integration.blockedReason} Saving this configuration is still useful — it
                    labels the destination and supports the manual workflow — but the status will
                    remain &ldquo;not connected&rdquo;.
                  </Notice>
                ) : null}

                {integration.configFields.map((field) => (
                  <Field key={field.key} label={field.label} htmlFor={field.key} hint={field.hint ?? undefined}>
                    <Input
                      id={field.key}
                      name={field.key}
                      type={field.type === "url" ? "url" : "text"}
                      placeholder={field.placeholder ?? undefined}
                      defaultValue={
                        typeof integration.config[field.key] === "string"
                          ? (integration.config[field.key] as string)
                          : ""
                      }
                    />
                  </Field>
                ))}

                <p className="text-[11.5px] leading-relaxed text-ghost">
                  Only non-secret configuration is stored here. Threadline never asks you to paste
                  an API key or access token into this screen.
                </p>
              </DialogBody>
              <DialogFooter>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <SubmitButton variant="primary" icon={Check}>
                  Save configuration
                </SubmitButton>
              </DialogFooter>
            </>
          )}
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------- Accounts -------------------------------- */

export function AccountManager({
  slug,
  accounts,
  canEdit,
}: {
  slug: string;
  accounts: {
    id: string;
    platform: string;
    handle: string;
    displayName: string | null;
    isConnected: boolean;
    publishCount: number;
  }[];
  canEdit: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <Card>
      <CardHeader
        title="Destinations"
        eyebrow="Accounts"
        description="Where content is published. These label the destination for manual publishing and for the distribution calendar."
        action={
          canEdit ? (
            <Button size="xs" variant="secondary" icon={Plus} onClick={() => setOpen(true)}>
              Add account
            </Button>
          ) : null
        }
      />
      <CardBody className="pt-0">
        {accounts.length === 0 ? (
          <p className="rounded-md border border-dashed border-line px-4 py-6 text-center text-[12.5px] text-faint">
            No destinations yet.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {accounts.map((account) => (
              <li key={account.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="text-[13px] font-medium text-ink">
                  {metaOf(PLATFORM_META, account.platform).label}
                </span>
                <span className="text-[12.5px] text-muted">{account.handle}</span>
                <Badge tone={account.isConnected ? "positive" : "outline"}>
                  {account.isConnected ? "Connected" : "Manual"}
                </Badge>
                {account.publishCount > 0 ? (
                  <span className="text-[11.5px] text-ghost">
                    {account.publishCount} published
                  </span>
                ) : null}
                {canEdit ? (
                  <ActionButton
                    size="xs"
                    variant="ghost"
                    icon={Trash2}
                    className="ml-auto"
                    action={() => deleteSocialAccountAction(slug, account.id)}
                    confirm={`Remove ${account.handle}?`}
                  >
                    <span className="sr-only">Remove</span>
                  </ActionButton>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogHeader
            title="Add a destination"
            description="A label for where content goes. Adding it does not create a connection."
          />
          <ActionForm
            action={createSocialAccountAction.bind(null, slug)}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
            className="contents"
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <Field label="Platform" htmlFor="accountPlatform">
                    <NativeSelect id="accountPlatform" name="platform" defaultValue="linkedin">
                      {PLATFORM_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label="Handle" htmlFor="accountHandle" error={fieldErrors.handle}>
                    <Input id="accountHandle" name="handle" required placeholder="@yourhandle" />
                  </Field>
                  <Field label="Display name" htmlFor="accountDisplayName" optional>
                    <Input id="accountDisplayName" name="displayName" />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary">Add</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
