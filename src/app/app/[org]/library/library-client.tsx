"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  ExternalLink,
  FileText,
  Film,
  Image as ImageIcon,
  Link2,
  Music,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge, Pill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { ActionButton, ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { ASSET_CATEGORIES, ASSET_CATEGORY_META, metaOf } from "@/lib/domain/enums";
import { bytes } from "@/lib/utils/format";
import { relativeTime } from "@/lib/utils/dates";
import {
  deleteAssetAction,
  linkLibraryAssetAction,
  uploadLibraryAssetAction,
} from "@/lib/actions/workspace";
import { DIRECT_THRESHOLD, directUpload } from "@/lib/storage/direct-client";
import { mineAssetAction } from "@/lib/actions/miner";

const PROCESSING_LABEL: Record<string, string> = { queued: "Processing queued", processing: "Processing", ready: "Processed", failed: "Processing failed" };

type AssetView = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  storagePath: string | null;
  externalUrl: string | null;
  version: number;
  tags: string[];
  uploadedBy: string | null;
  contentItemId: string | null;
  contentTitle: string | null;
  createdAt: string;
  processingState?: string;
  sourceNote?: string | null;
};

function iconFor(mimeType: string | null, externalUrl: string | null) {
  if (externalUrl && !mimeType) return Link2;
  if (!mimeType) return FileText;
  if (mimeType.startsWith("video/")) return Film;
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("audio/")) return Music;
  return FileText;
}

export function LibraryGrid({
  slug,
  assets,
  canManage,
  canMine = false,
}: {
  slug: string;
  assets: AssetView[];
  canManage: boolean;
  /** AI-01: whether this person can mine text files for evidence. */
  canMine?: boolean;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {assets.map((asset) => {
        const Icon = iconFor(asset.mimeType, asset.externalUrl);
        const category = metaOf(ASSET_CATEGORY_META, asset.category);
        const href = asset.storagePath
          ? `/api/files/${asset.storagePath}`
          : (asset.externalUrl ?? null);

        return (
          <li key={asset.id}>
            <Card className="flex h-full flex-col">
              <CardBody className="flex-1 pt-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-md border border-line bg-surface">
                    <Icon className="size-4 text-faint" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink" title={asset.title}>
                      {asset.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ghost">
                      {category.label}
                      {asset.sizeBytes ? ` · ${bytes(asset.sizeBytes)}` : ""}
                      {asset.version > 1 ? ` · v${asset.version}` : ""}
                      {asset.processingState && PROCESSING_LABEL[asset.processingState] ? ` · ${PROCESSING_LABEL[asset.processingState]}` : ""}
                    </p>
                  </div>
                </div>

                {asset.sourceNote ? <p className="mt-2 text-[11px] text-ghost">{asset.sourceNote}</p> : null}

                {asset.description ? (
                  <p className="mt-3 line-clamp-3 text-[12px] leading-relaxed text-muted">
                    {asset.description}
                  </p>
                ) : null}

                {asset.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {asset.tags.map((tag) => (
                      <Pill key={tag}>{tag}</Pill>
                    ))}
                  </div>
                ) : null}

                {asset.contentItemId && asset.contentTitle ? (
                  <Link
                    href={`/app/${slug}/production/${asset.contentItemId}`}
                    className="mt-3 block truncate text-[11.5px] text-accent transition-colors hover:text-accent-bright"
                  >
                    {asset.contentTitle}
                  </Link>
                ) : null}
              </CardBody>

              <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-2.5">
                <span className="truncate text-[11px] text-ghost">
                  {asset.uploadedBy ? `${asset.uploadedBy} · ` : ""}
                  {relativeTime(new Date(asset.createdAt))}
                </span>
                <div className="flex shrink-0 items-center gap-0.5">
                  {href ? (
                    <a
                      href={href}
                      target={asset.externalUrl ? "_blank" : undefined}
                      rel={asset.externalUrl ? "noreferrer noopener" : undefined}
                      className="rounded p-1.5 text-ghost transition-colors hover:text-muted"
                      aria-label={asset.externalUrl ? `Open ${asset.title}` : `Download ${asset.title}`}
                    >
                      {asset.externalUrl ? (
                        <ExternalLink className="size-3.5" />
                      ) : (
                        <Download className="size-3.5" />
                      )}
                    </a>
                  ) : null}
                  {canMine && asset.storagePath && asset.mimeType && /^text\/|application\/json/.test(asset.mimeType) ? (
                    <ActionButton size="xs" variant="ghost" action={() => mineAssetAction(slug, asset.id)}>
                      Mine it
                    </ActionButton>
                  ) : null}
                  {canManage ? (
                    <ActionButton
                      size="xs"
                      variant="ghost"
                      icon={Trash2}
                      action={() => deleteAssetAction(slug, asset.id)}
                      confirm={`Delete "${asset.title}"? This cannot be undone.`}
                    >
                      <span className="sr-only">Delete</span>
                    </ActionButton>
                  ) : null}
                </div>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

export function LibraryUploadButtons({
  slug,
  content,
}: {
  slug: string;
  content: { id: string; title: string }[];
}) {
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [picked, setPicked] = React.useState<File | null>(null);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [directError, setDirectError] = React.useState<string | null>(null);
  const large = Boolean(picked && picked.size > DIRECT_THRESHOLD);

  async function sendDirect(form: HTMLFormElement | null) {
    if (!picked || !form) return;
    const data = new FormData(form);
    setDirectError(null);
    setProgress(0);
    try {
      await directUpload(slug, picked, {
        category: String(data.get("category") || "raw_media"),
        title: String(data.get("title") || "") || undefined,
        contentItemId: String(data.get("contentItemId") || "") || undefined,
      }, setProgress);
      setUploadOpen(false);
      setPicked(null);
      router.refresh();
    } catch (e) {
      setDirectError(e instanceof Error ? e.message : "The upload failed.");
    } finally {
      setProgress(null);
    }
  }
  const [linkOpen, setLinkOpen] = React.useState(false);
  const router = useRouter();

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button variant="secondary" icon={Link2} onClick={() => setLinkOpen(true)}>
        Add a link
      </Button>
      <Button icon={Upload} onClick={() => setUploadOpen(true)}>
        Upload
      </Button>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader
            title="Upload to the library"
            description="Stored privately and served only to members of this workspace."
          />
          <ActionForm
            action={uploadLibraryAssetAction.bind(null, slug)}
            onSuccess={() => {
              setUploadOpen(false);
              router.refresh();
            }}
            className="contents"
          >
            {({ error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error ?? directError} />
                  <Field label="File" htmlFor="libraryFile" hint={large ? "Large file: it goes straight to private storage in parts." : undefined}>
                    <input
                      id="libraryFile"
                      name="file"
                      type="file"
                      required
                      onChange={(e) => setPicked(e.currentTarget.files?.[0] ?? null)}
                      className="block w-full text-[13px] text-muted file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-raised file:px-3 file:py-1.5 file:text-[12.5px] file:text-ink hover:file:bg-[#242b32]"
                    />
                  </Field>
                  <Field label="Category" htmlFor="libraryCategory">
                    <NativeSelect id="libraryCategory" name="category" defaultValue="research_doc">
                      {ASSET_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {ASSET_CATEGORY_META[c].label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label="Title" htmlFor="libraryTitle" optional>
                    <Input id="libraryTitle" name="title" placeholder="Defaults to the file name" />
                  </Field>
                  <Field label="Description" htmlFor="libraryDescription" optional>
                    <Textarea id="libraryDescription" name="description" rows={2} />
                  </Field>
                  <Field label="Tags" htmlFor="libraryTags" optional hint="Comma separated.">
                    <Input id="libraryTags" name="tags" />
                  </Field>
                  {content.length > 0 ? (
                    <Field label="Link to content" htmlFor="libraryContent" optional>
                      <NativeSelect id="libraryContent" name="contentItemId" defaultValue="">
                        <option value="">Not linked</option>
                        {content.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  ) : null}
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setUploadOpen(false)}>
                    Cancel
                  </Button>
                  {large ? (
                    <Button variant="primary" icon={Upload} disabled={progress !== null} onClick={(e) => sendDirect(e.currentTarget.closest("form"))}>
                      {progress !== null ? `Uploading ${Math.round(progress * 100)}%` : "Upload"}
                    </Button>
                  ) : (
                    <SubmitButton variant="primary" icon={Upload} pendingLabel="Uploading…">
                      Upload
                    </SubmitButton>
                  )}
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader
            title="Add a link"
            description="For files that live in Drive, Dropbox or elsewhere. Threadline stores the link, not the file."
          />
          <ActionForm
            action={linkLibraryAssetAction.bind(null, slug)}
            onSuccess={() => {
              setLinkOpen(false);
              router.refresh();
            }}
            className="contents"
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <Field label="Title" htmlFor="linkTitle" error={fieldErrors.title}>
                    <Input id="linkTitle" name="title" required autoFocus />
                  </Field>
                  <Field label="URL" htmlFor="linkUrl" error={fieldErrors.externalUrl}>
                    <Input id="linkUrl" name="externalUrl" type="url" required placeholder="https://" />
                  </Field>
                  <Field label="Category" htmlFor="linkCategory">
                    <NativeSelect id="linkCategory" name="category" defaultValue="research_doc">
                      {ASSET_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {ASSET_CATEGORY_META[c].label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label="Description" htmlFor="linkDescription" optional>
                    <Textarea id="linkDescription" name="description" rows={2} />
                  </Field>
                  <Field label="Tags" htmlFor="linkTags" optional hint="Comma separated.">
                    <Input id="linkTags" name="tags" />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setLinkOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary">Add link</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Badge helper reused by the content detail page's asset list. */
export function AssetCategoryBadge({ category }: { category: string }) {
  const meta = metaOf(ASSET_CATEGORY_META, category);
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
