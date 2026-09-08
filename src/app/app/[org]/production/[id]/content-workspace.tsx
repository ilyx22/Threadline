"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Check,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge, Pill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/data";
import { CopyButton } from "@/components/ui/copy-button";
import { Notice } from "@/components/ui/feedback";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import {
  addCommentAction,
  assignEditorAction,
  generatePackagingAction,
  moveContentAction,
  resolveCommentAction,
  savePackageAction,
  updateContentDetailsAction,
  uploadContentAssetAction,
} from "@/lib/actions/content";
import { CONTENT_STAGE_META, PLATFORM_META, PLATFORM_OPTIONS, PRIORITY_OPTIONS, metaOf } from "@/lib/domain/enums";
import { nextContentStages } from "@/lib/domain/workflow";
import { duration } from "@/lib/utils/format";
import { relativeTime, toDateInput } from "@/lib/utils/dates";

type Comment = {
  id: string;
  body: string;
  kind: string;
  resolved: boolean;
  authorName: string;
  authorHue: number;
  createdAt: string;
};

type PackageView = {
  id: string;
  platform: string;
  title: string | null;
  caption: string | null;
  description: string | null;
  hashtags: string[];
  overlays: string[];
  thumbnailConcepts: string[];
  ctaOptions: string[];
  clipOpportunities: { label: string; startSec: number; endSec: number; rationale: string }[];
  repurposing: string | null;
  status: string;
  generatedBy: string;
};

/**
 * The interactive half of the content detail page: stage transitions, editor
 * assignment, structured revision requests, comments, uploads and packaging.
 */
export function ContentWorkspace({
  slug,
  canEdit,
  canApprove,
  canAssign,
  canUpload,
  canGenerate,
  item,
  editors,
  comments,
  packages,
}: {
  slug: string;
  canEdit: boolean;
  canApprove: boolean;
  canAssign: boolean;
  canUpload: boolean;
  canGenerate: boolean;
  item: {
    id: string;
    title: string;
    stage: string;
    platform: string;
    priority: string;
    dueDate: string | null;
    editorId: string | null;
    selectedHook: string | null;
  };
  editors: { id: string; name: string; avatarHue: number }[];
  comments: Comment[];
  packages: PackageView[];
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [revisionOpen, setRevisionOpen] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [packagingOpen, setPackagingOpen] = React.useState(false);

  const stages = nextContentStages(item.stage as never).filter(
    (s) => s !== "approved" || canApprove,
  );

  const move = (stage: string, note?: string) => {
    startTransition(async () => {
      const result = await moveContentAction(slug, item.id, stage, note);
      if (result.ok) {
        toast.success(result.message ?? "Stage updated.");
        setRevisionOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const assign = (editorId: string | null) => {
    startTransition(async () => {
      const result = await assignEditorAction(slug, item.id, editorId);
      if (result.ok) {
        toast.success(result.message ?? "Assignment updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const canPackage = ["approved", "scheduled", "live"].includes(item.stage);

  return (
    <>
      {/* ------------------------------- Action bar ------------------------------- */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-elevated p-3">
        {canEdit && item.stage === "in_review" && canApprove ? (
          <>
            <Button variant="accent" icon={BadgeCheck} loading={pending} onClick={() => move("approved")}>
              Approve
            </Button>
            <Button variant="secondary" icon={RotateCcw} onClick={() => setRevisionOpen(true)}>
              Request changes
            </Button>
          </>
        ) : null}

        {canEdit && stages.length > 0 && item.stage !== "in_review" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" iconRight={ArrowRight}>
                Move stage
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Move to</DropdownMenuLabel>
              {stages.map((stage) => (
                <DropdownMenuItem
                  key={stage}
                  onSelect={() => (stage === "changes_requested" ? setRevisionOpen(true) : move(stage))}
                >
                  {metaOf(CONTENT_STAGE_META, stage).label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {canAssign ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">
                {item.editorId
                  ? `Editor: ${editors.find((e) => e.id === item.editorId)?.name ?? "Assigned"}`
                  : "Assign editor"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Assign to</DropdownMenuLabel>
              {editors.map((editor) => (
                <DropdownMenuItem key={editor.id} onSelect={() => assign(editor.id)}>
                  {editor.name}
                </DropdownMenuItem>
              ))}
              {item.editorId ? (
                <DropdownMenuItem onSelect={() => assign(null)}>Unassign</DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {canUpload ? (
          <Button variant="ghost" icon={Upload} onClick={() => setUploadOpen(true)}>
            Upload file
          </Button>
        ) : null}

        {canEdit ? (
          <Button variant="ghost" onClick={() => setDetailsOpen(true)}>
            Edit details
          </Button>
        ) : null}

        {canGenerate && canPackage ? (
          <Button
            variant="ghost"
            icon={Boxes}
            className="ml-auto"
            onClick={() => setPackagingOpen(true)}
          >
            {packages.length > 0 ? "Re-package" : "Package for distribution"}
          </Button>
        ) : null}
      </div>

      {/* -------------------------- Packaging + comments -------------------------- */}
      <Tabs defaultValue={packages.length > 0 ? "packaging" : "comments"}>
        <TabsList>
          <TabsTrigger value="comments" count={comments.length}>
            Comments
          </TabsTrigger>
          <TabsTrigger value="packaging" count={packages.length}>
            Packaging
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="pt-5">
          <Card>
            <CardBody className="pt-4">
              {comments.length === 0 ? (
                <p className="py-4 text-center text-[12.5px] text-faint">
                  No comments. Revision requests appear here automatically with their reason.
                </p>
              ) : (
                <ul className="space-y-4">
                  {comments.map((comment) => (
                    <li key={comment.id} className="flex gap-3">
                      <Avatar name={comment.authorName} hue={comment.authorHue} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[12.5px] font-medium text-ink">
                            {comment.authorName}
                          </span>
                          {comment.kind === "revision_request" ? (
                            <Badge tone="warning">Revision request</Badge>
                          ) : null}
                          {comment.resolved ? <Badge tone="positive">Resolved</Badge> : null}
                          <span className="text-[11px] text-ghost">
                            {relativeTime(new Date(comment.createdAt))}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "mt-1 whitespace-pre-wrap text-[13px] leading-relaxed",
                            comment.resolved ? "text-faint" : "text-muted",
                          )}
                        >
                          {comment.body}
                        </p>
                        {canEdit && comment.kind === "revision_request" ? (
                          <Button
                            size="xs"
                            variant="ghost"
                            icon={Check}
                            className="mt-1.5 -ml-2"
                            loading={pending}
                            onClick={() =>
                              startTransition(async () => {
                                const result = await resolveCommentAction(
                                  slug,
                                  comment.id,
                                  !comment.resolved,
                                );
                                if (result.ok) router.refresh();
                                else toast.error(result.error);
                              })
                            }
                          >
                            {comment.resolved ? "Reopen" : "Mark resolved"}
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-5 border-t border-line pt-4">
                <ActionForm
                  action={addCommentAction.bind(null, slug, item.id)}
                  resetOnSuccess
                  onSuccess={() => router.refresh()}
                >
                  {({ fieldErrors }) => (
                    <div className="space-y-2.5">
                      <Field htmlFor="commentBody" error={fieldErrors.body}>
                        <Textarea
                          id="commentBody"
                          name="body"
                          rows={3}
                          placeholder="Add a note. Reference a timecode where you can."
                        />
                      </Field>
                      <div className="flex justify-end">
                        <SubmitButton size="sm" variant="secondary" icon={MessageSquare}>
                          Comment
                        </SubmitButton>
                      </div>
                    </div>
                  )}
                </ActionForm>
              </div>
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="packaging" className="pt-5">
          {packages.length === 0 ? (
            <Card>
              <CardBody className="py-10 text-center">
                <p className="text-[13px] text-muted">
                  {canPackage
                    ? "Not packaged yet. Packaging produces genuinely different copy per platform, not one caption reused everywhere."
                    : "Packaging becomes available once the piece is approved."}
                </p>
                {canGenerate && canPackage ? (
                  <Button
                    variant="accent"
                    icon={Boxes}
                    className="mt-4"
                    onClick={() => setPackagingOpen(true)}
                  >
                    Package for distribution
                  </Button>
                ) : null}
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-4">
              {packages.map((pkg) => (
                <PackageCard key={pkg.id} slug={slug} pkg={pkg} canEdit={canEdit} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* --------------------------------- Dialogs -------------------------------- */}

      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent>
          <DialogHeader
            title="Request changes"
            description="Name the timecode and the change. This goes to the editor verbatim."
          />
          <form
            action={(formData) => {
              const note = String(formData.get("note") ?? "").trim();
              if (!note) {
                toast.error("Add a revision note.");
                return;
              }
              move("changes_requested", note);
            }}
          >
            <DialogBody>
              <Field label="What needs to change" htmlFor="revisionNote">
                <Textarea
                  id="revisionNote"
                  name="note"
                  rows={5}
                  required
                  autoFocus
                  placeholder="The number at 00:34 should be 19%, not 15%. Everything else is fine."
                />
              </Field>
            </DialogBody>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setRevisionOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={pending}>
                Send back
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader
            title="Upload a file"
            description="Raw footage, an edit, a thumbnail or a transcript. Files are stored privately and served only to workspace members."
          />
          <ActionForm
            action={uploadContentAssetAction.bind(null, slug, item.id)}
            onSuccess={() => {
              setUploadOpen(false);
              router.refresh();
            }}
            className="contents"
          >
            {({ error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <Field label="Type" htmlFor="assetCategory">
                    <NativeSelect id="assetCategory" name="category" defaultValue="edited_media">
                      <option value="raw_media">Raw footage</option>
                      <option value="edited_media">Edited video</option>
                      <option value="thumbnail">Thumbnail</option>
                      <option value="transcript">Transcript</option>
                      <option value="script_doc">Script document</option>
                    </NativeSelect>
                  </Field>
                  <Field label="File" htmlFor="assetFile">
                    <input
                      id="assetFile"
                      name="file"
                      type="file"
                      required
                      className="block w-full text-[13px] text-muted file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-raised file:px-3 file:py-1.5 file:text-[12.5px] file:text-ink hover:file:bg-[#242b32]"
                    />
                  </Field>
                  <Field label="Label" htmlFor="assetTitle" optional>
                    <Input id="assetTitle" name="title" placeholder="Defaults to the file name" />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setUploadOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary" icon={Upload} pendingLabel="Uploading…">
                    Upload
                  </SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader title="Edit details" />
          <ActionForm
            action={updateContentDetailsAction.bind(null, slug, item.id)}
            onSuccess={() => {
              setDetailsOpen(false);
              router.refresh();
            }}
            className="contents"
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <Field label="Title" htmlFor="contentTitle" error={fieldErrors.title}>
                    <Input id="contentTitle" name="title" defaultValue={item.title} required />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Platform" htmlFor="contentPlatform">
                      <NativeSelect id="contentPlatform" name="platform" defaultValue={item.platform}>
                        {PLATFORM_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label="Priority" htmlFor="contentPriority">
                      <NativeSelect id="contentPriority" name="priority" defaultValue={item.priority}>
                        {PRIORITY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>
                  <Field label="Due date" htmlFor="contentDue" optional>
                    <Input
                      id="contentDue"
                      name="dueDate"
                      type="date"
                      defaultValue={toDateInput(item.dueDate)}
                    />
                  </Field>
                  <Field label="Selected hook" htmlFor="contentHook" optional>
                    <Textarea
                      id="contentHook"
                      name="selectedHook"
                      defaultValue={item.selectedHook ?? ""}
                      rows={2}
                    />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setDetailsOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary">Save</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>

      <PackagingDialog
        slug={slug}
        contentItemId={item.id}
        defaultPlatform={item.platform}
        open={packagingOpen}
        onOpenChange={setPackagingOpen}
      />
    </>
  );
}

function PackageCard({ slug, pkg, canEdit }: { slug: string; pkg: PackageView; canEdit: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);

  return (
    <Card>
      <CardHeader
        title={metaOf(PLATFORM_META, pkg.platform).label}
        eyebrow={pkg.generatedBy === "ai" ? "Generated" : "Human edited"}
        action={
          <div className="flex items-center gap-2">
            <Badge tone={pkg.status === "ready" ? "positive" : "outline"}>{pkg.status}</Badge>
            {canEdit ? (
              <Button size="xs" variant="ghost" onClick={() => setEditing((v) => !v)}>
                {editing ? "Cancel" : "Edit"}
              </Button>
            ) : null}
          </div>
        }
      />
      <CardBody className="pt-0">
        {editing ? (
          <ActionForm
            action={savePackageAction.bind(null, slug, pkg.id)}
            onSuccess={() => {
              setEditing(false);
              router.refresh();
            }}
            className="space-y-4"
          >
            <Field label="Title" htmlFor={`title-${pkg.id}`}>
              <Input id={`title-${pkg.id}`} name="title" defaultValue={pkg.title ?? ""} />
            </Field>
            <Field label="Caption" htmlFor={`caption-${pkg.id}`}>
              <Textarea id={`caption-${pkg.id}`} name="caption" defaultValue={pkg.caption ?? ""} rows={8} />
            </Field>
            <Field label="Description" htmlFor={`description-${pkg.id}`} optional>
              <Textarea
                id={`description-${pkg.id}`}
                name="description"
                defaultValue={pkg.description ?? ""}
                rows={4}
              />
            </Field>
            <Field label="Hashtags" htmlFor={`hashtags-${pkg.id}`} optional hint="Space or comma separated.">
              <Input id={`hashtags-${pkg.id}`} name="hashtags" defaultValue={pkg.hashtags.join(" ")} />
            </Field>
            <Field label="Repurposing" htmlFor={`repurposing-${pkg.id}`} optional>
              <Textarea
                id={`repurposing-${pkg.id}`}
                name="repurposing"
                defaultValue={pkg.repurposing ?? ""}
                rows={2}
              />
            </Field>
            <div className="flex justify-end">
              <SubmitButton variant="primary" size="sm">
                Save packaging
              </SubmitButton>
            </div>
          </ActionForm>
        ) : (
          <div className="space-y-4">
            {pkg.title ? (
              <div>
                <p className="text-eyebrow mb-1 text-faint">Title</p>
                <p className="text-[13.5px] text-ink">{pkg.title}</p>
              </div>
            ) : null}

            {pkg.caption ? (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-eyebrow text-faint">Caption</p>
                  <CopyButton value={pkg.caption} />
                </div>
                <p className="whitespace-pre-wrap rounded-md border border-line bg-surface p-3 text-[13px] leading-relaxed text-muted">
                  {pkg.caption}
                </p>
              </div>
            ) : null}

            {pkg.description ? (
              <div>
                <p className="text-eyebrow mb-1 text-faint">Description</p>
                <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-muted">
                  {pkg.description}
                </p>
              </div>
            ) : null}

            {pkg.hashtags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {pkg.hashtags.map((tag) => (
                  <Pill key={tag}>{tag}</Pill>
                ))}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              {pkg.overlays.length > 0 ? (
                <div>
                  <p className="text-eyebrow mb-1.5 text-faint">Text overlays</p>
                  <ul className="space-y-1">
                    {pkg.overlays.map((o, i) => (
                      <li key={i} className="text-[12px] leading-relaxed text-muted">
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {pkg.thumbnailConcepts.length > 0 ? (
                <div>
                  <p className="text-eyebrow mb-1.5 text-faint">Thumbnail concepts</p>
                  <ul className="space-y-1">
                    {pkg.thumbnailConcepts.map((t, i) => (
                      <li key={i} className="text-[12px] leading-relaxed text-muted">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {pkg.clipOpportunities.length > 0 ? (
              <div>
                <p className="text-eyebrow mb-1.5 text-faint">Clip opportunities</p>
                <ul className="space-y-1.5">
                  {pkg.clipOpportunities.map((clip, i) => (
                    <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed">
                      <span className="shrink-0 tabular text-accent">
                        {duration(clip.startSec)}–{duration(clip.endSec)}
                      </span>
                      <span className="text-muted">
                        <span className="text-ink">{clip.label}</span>
                        {clip.rationale ? ` — ${clip.rationale}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {pkg.repurposing ? (
              <div className="rounded-md border border-line bg-surface p-3">
                <p className="text-eyebrow mb-1 text-faint">Repurposing</p>
                <p className="text-[12.5px] leading-relaxed text-muted">{pkg.repurposing}</p>
              </div>
            ) : null}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function PackagingDialog({
  slug,
  contentItemId,
  defaultPlatform,
  open,
  onOpenChange,
}: {
  slug: string;
  contentItemId: string;
  defaultPlatform: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string[]>([defaultPlatform]);
  const [pending, startTransition] = React.useTransition();

  const toggle = (platform: string) => {
    setSelected((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform],
    );
  };

  const generate = () => {
    if (selected.length === 0) {
      toast.error("Choose at least one platform.");
      return;
    }
    startTransition(async () => {
      const result = await generatePackagingAction(slug, contentItemId, selected);
      if (result.ok) {
        toast.success(result.message ?? "Packaged.");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader
          title="Package for distribution"
          description="Each platform gets genuinely different copy — LinkedIn rewards a structured argument, YouTube rewards a searchable title, X rewards compression."
        />
        <DialogBody className="space-y-4">
          <Notice tone="neutral">
            Existing packaging for a selected platform is replaced. Human edits you have made will
            be overwritten.
          </Notice>
          <div>
            <p className="text-eyebrow mb-2 text-faint">Platforms</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  className={cn(
                    "inline-flex h-8 items-center rounded-md border px-3 text-[12.5px] transition-colors",
                    selected.includes(option.value)
                      ? "border-accent-line bg-accent-soft text-accent"
                      : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="accent" icon={Sparkles} loading={pending} onClick={generate}>
            Generate packaging
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
