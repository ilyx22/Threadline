"use client";

import { Check } from "lucide-react";
import { CardBody, CardFooter } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { updateWorkspaceAction } from "@/lib/actions/workspace";

const TIMEZONES = [
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
];

export function WorkspaceForm({
  slug,
  canEdit,
  defaults,
}: {
  slug: string;
  canEdit: boolean;
  defaults: {
    name: string;
    website: string;
    industry: string;
    geography: string;
    timezone: string;
  };
}) {
  return (
    <ActionForm action={updateWorkspaceAction.bind(null, slug)}>
      {({ fieldErrors, error }) => (
        <>
          <CardBody className="space-y-5 pt-0">
            <FormError error={error} />
            <Field label="Workspace name" htmlFor="wsName" error={fieldErrors.name}>
              <Input id="wsName" name="name" defaultValue={defaults.name} required disabled={!canEdit} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Website" htmlFor="wsWebsite" optional error={fieldErrors.website}>
                <Input
                  id="wsWebsite"
                  name="website"
                  defaultValue={defaults.website}
                  placeholder="https://"
                  disabled={!canEdit}
                />
              </Field>
              <Field label="Industry" htmlFor="wsIndustry" optional>
                <Input
                  id="wsIndustry"
                  name="industry"
                  defaultValue={defaults.industry}
                  disabled={!canEdit}
                />
              </Field>
              <Field label="Geography" htmlFor="wsGeography" optional>
                <Input
                  id="wsGeography"
                  name="geography"
                  defaultValue={defaults.geography}
                  disabled={!canEdit}
                />
              </Field>
              <Field
                label="Timezone"
                htmlFor="wsTimezone"
                hint="Used for scheduling and weekly report periods."
              >
                <NativeSelect
                  id="wsTimezone"
                  name="timezone"
                  defaultValue={defaults.timezone}
                  disabled={!canEdit}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
          </CardBody>
          {canEdit ? (
            <CardFooter>
              <span className="text-[12px] text-faint">
                Changes apply immediately across the workspace.
              </span>
              <SubmitButton variant="primary" icon={Check}>
                Save
              </SubmitButton>
            </CardFooter>
          ) : null}
        </>
      )}
    </ActionForm>
  );
}
