"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { saveSopAction } from "@/lib/actions/admin";
import { SOP_CATEGORIES, SOP_CATEGORY_META } from "@/lib/domain/enums";
import { MarkdownView } from "@/components/ui/markdown";

/**
 * SOP editor with a read view and an edit view.
 *
 * Saving increments the version, so a change to a working procedure is visible
 * rather than silent.
 */
export function SopEditor({
  sopKey,
  defaults,
}: {
  sopKey: string;
  defaults: { title: string; category: string; summary: string; body: string };
}) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"read" | "edit">("read");
  const [body, setBody] = React.useState(defaults.body);

  return (
    <div className="space-y-4">
      <SegmentedControl
        value={mode}
        onValueChange={setMode}
        size="sm"
        options={[
          { value: "read", label: "Read", icon: Eye },
          { value: "edit", label: "Edit", icon: Pencil },
        ]}
      />

      {mode === "read" ? (
        <Card>
          <CardBody className="pt-5">
            <MarkdownView content={defaults.body} />
          </CardBody>
        </Card>
      ) : (
        <ActionForm
          action={saveSopAction.bind(null, sopKey)}
          onSuccess={() => {
            setMode("read");
            router.refresh();
          }}
        >
          {({ fieldErrors, error }) => (
            <Card>
              <CardBody className="space-y-5 pt-5">
                <FormError error={error} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Title" htmlFor="sopTitle" error={fieldErrors.title}>
                    <Input id="sopTitle" name="title" defaultValue={defaults.title} required />
                  </Field>
                  <Field label="Category" htmlFor="sopCategory">
                    <NativeSelect id="sopCategory" name="category" defaultValue={defaults.category}>
                      {SOP_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {SOP_CATEGORY_META[c].label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                </div>
                <Field label="Summary" htmlFor="sopSummary" hint="One line. Shown on the index." optional>
                  <Input id="sopSummary" name="summary" defaultValue={defaults.summary} />
                </Field>
                <Field
                  label="Body"
                  htmlFor="sopBody"
                  hint="Markdown: ## headings, - bullets, 1. numbered lists, **bold**."
                >
                  <Textarea
                    id="sopBody"
                    name="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={26}
                    className="font-mono text-[12.5px] leading-relaxed"
                  />
                </Field>
              </CardBody>
              <CardFooter>
                <span className="text-[12px] text-faint">Saving increments the version.</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setMode("read")}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary" icon={Check}>
                    Save
                  </SubmitButton>
                </div>
              </CardFooter>
            </Card>
          )}
        </ActionForm>
      )}
    </div>
  );
}
