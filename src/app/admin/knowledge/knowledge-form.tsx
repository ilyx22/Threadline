"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { createKnowledgeAction, updateKnowledgeAction } from "@/lib/actions/knowledge";
import { KNOWLEDGE_KINDS, KNOWLEDGE_KIND_LABEL, KNOWLEDGE_PLATFORMS } from "@/lib/knowledge/chunk";

type Defaults = { title: string; kind: string; platform: string; summary: string; source: string; body: string };
const EMPTY: Defaults = { title: "", kind: "framework", platform: "all", summary: "", source: "", body: "" };

/** Add a document (no id) or save a new version of one (id). */
export function KnowledgeForm({ id, defaults = EMPTY, onDone }: { id?: string; defaults?: Defaults; onDone?: () => void }) {
  const router = useRouter();
  const action = id ? updateKnowledgeAction.bind(null, id) : createKnowledgeAction;
  return (
    <ActionForm
      action={action as typeof createKnowledgeAction}
      resetOnSuccess={!id}
      onSuccess={(data) => {
        onDone?.();
        if (!id && data?.id) router.push(`/admin/knowledge/${data.id}`);
        else router.refresh();
      }}
    >
      {({ fieldErrors, error }) => (
        <Card>
          <CardBody className="space-y-5 pt-5">
            <FormError error={error} />
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Title" htmlFor="kbTitle" error={fieldErrors.title}>
                <Input id="kbTitle" name="title" defaultValue={defaults.title} required />
              </Field>
              <Field label="Type" htmlFor="kbKind">
                <NativeSelect id="kbKind" name="kind" defaultValue={defaults.kind}>
                  {KNOWLEDGE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {KNOWLEDGE_KIND_LABEL[k]}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Platform" htmlFor="kbPlatform" hint="Only used for that platform, or all.">
                <NativeSelect id="kbPlatform" name="platform" defaultValue={defaults.platform}>
                  {KNOWLEDGE_PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p === "all" ? "All platforms" : p}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Summary" htmlFor="kbSummary" optional>
                <Input id="kbSummary" name="summary" defaultValue={defaults.summary} />
              </Field>
              <Field label="Source" htmlFor="kbSource" hint="File name or Drive link, for reference." optional>
                <Input id="kbSource" name="source" defaultValue={defaults.source} />
              </Field>
            </div>
            <Field
              label="Text"
              htmlFor="kbBody"
              hint="Paste the document. ## headings keep sections together. An attached .md/.txt file replaces this text."
            >
              <Textarea
                id="kbBody"
                name="body"
                defaultValue={defaults.body}
                rows={id ? 26 : 12}
                className="font-mono text-[12.5px] leading-relaxed"
              />
            </Field>
            <Field label="File" htmlFor="kbFile" optional>
              <Input id="kbFile" name="file" type="file" accept=".md,.markdown,.txt,text/plain,text/markdown" />
            </Field>
          </CardBody>
          <CardFooter>
            <span className="text-[12px] text-faint">
              {id ? "Saving keeps the old version restorable." : "Used in generation as soon as it is added."}
            </span>
            <div className="flex items-center gap-2">
              {onDone ? (
                <Button variant="ghost" onClick={onDone}>
                  Cancel
                </Button>
              ) : null}
              <SubmitButton variant="primary" icon={Check}>
                {id ? "Save" : "Add"}
              </SubmitButton>
            </div>
          </CardFooter>
        </Card>
      )}
    </ActionForm>
  );
}
