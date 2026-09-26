"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Crown, MailPlus, MoreHorizontal, RotateCw, UserMinus, UserPlus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/data";
import { Table, TBody, TD, TH, THead, TR, CellTitle } from "@/components/ui/table";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/menu";
import { RoleBadge } from "@/components/ui/status";
import { toast } from "@/components/ui/toast";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { updateMemberRoleAction } from "@/lib/actions/workspace";
import {
  inviteAction,
  reinstateMemberAction,
  removeMemberAction,
  resendInvitationAction,
  revokeInvitationAction,
  suspendMemberAction,
  transferOwnershipAction,
  updateMemberProfileAction,
} from "@/lib/actions/team";
import type { ActionResult } from "@/lib/actions/shared";
import { ROLE_META, metaOf } from "@/lib/domain/enums";
import { relativeTime } from "@/lib/utils/dates";

type Member = {
  id: string;
  name: string;
  email: string;
  title: string | null;
  role: string;
  avatarHue: number;
  lastSeenAt: string | null;
  status: string;
  isOwner: boolean;
  isExpert: boolean;
  voiceNotes?: string | null;
  contactRole: string | null;
  profiles: string[];
};

export type PendingInvitation = { id: string; name: string; email: string; role: string; state: string; expiresAt: string; sentCount: number };

const PROFILE_LABEL: Record<string, string> = {
  approver: "Approver",
  contributor: "Contributor",
  viewer: "View only",
  commercial: "Commercial",
};
const SETTABLE_PROFILES = ["approver", "contributor", "viewer", "commercial"] as const;

function useRun() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const run = (fn: () => Promise<ActionResult<unknown>>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(r.message ?? "Done.");
        router.refresh();
      } else toast.error(r.error);
    });
  };
  return { pending, run };
}

export function MembersTable({
  slug,
  members,
  canManage,
  currentUserId,
  assignableRoles,
  isClientWorkspace,
  viewerIsStaff,
}: {
  slug: string;
  members: Member[];
  canManage: boolean;
  currentUserId: string;
  assignableRoles: string[];
  isClientWorkspace: boolean;
  viewerIsStaff: boolean;
}) {
  // A client admin cannot change a Threadline staff membership (the server
  // refuses it), so no menu is offered for one.
  const manageable = (m: Member) => m.id !== currentUserId && (viewerIsStaff || !["internal_operator", "super_admin"].includes(m.role));
  const { pending, run } = useRun();
  const [editing, setEditing] = React.useState<Member | null>(null);

  return (
    <>
      <Table>
        <THead>
          <TR>
            <TH>Person</TH>
            <TH>Role</TH>
            <TH>Last seen</TH>
            {canManage ? <TH align="right">Actions</TH> : null}
          </TR>
        </THead>
        <TBody>
          {members.map((m) => (
            <TR key={m.id}>
              <TD>
                <div className="flex items-center gap-3">
                  <Avatar name={m.name} hue={m.avatarHue} />
                  <CellTitle secondary={m.email}>
                    {m.name}
                    {m.id === currentUserId ? <span className="ml-2 text-[11px] text-ghost">you</span> : null}
                  </CellTitle>
                </div>
              </TD>
              <TD>
                <div className="flex flex-wrap items-center gap-1.5">
                  <RoleBadge role={m.role} />
                  {m.isOwner ? <Badge tone="accent">Owner</Badge> : null}
                  {m.status === "suspended" ? <Badge tone="negative">Suspended</Badge> : null}
                  {m.isExpert ? <Badge tone="outline">Expert</Badge> : null}
                  {m.contactRole ? <Badge tone="outline">{m.contactRole === "primary" ? "Primary contact" : "Backup contact"}</Badge> : null}
                  {m.profiles.filter((p) => p !== "admin").map((p) => (
                    <Badge key={p} tone="neutral">{PROFILE_LABEL[p] ?? p}</Badge>
                  ))}
                </div>
              </TD>
              <TD>{m.lastSeenAt ? relativeTime(new Date(m.lastSeenAt)) : "Never"}</TD>
              {canManage ? (
                <TD align="right">
                  {!manageable(m) ? (
                    <span className="text-[12px] text-ghost">—</span>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="xs" variant="ghost" icon={MoreHorizontal} disabled={pending}>
                          <span className="sr-only">Manage {m.name}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!m.isOwner && assignableRoles.filter((r) => r !== m.role).length ? (
                          <>
                            <DropdownMenuLabel>Set role</DropdownMenuLabel>
                            {assignableRoles
                              .filter((r) => r !== m.role)
                              .map((role) => (
                                <DropdownMenuItem key={role} onSelect={() => run(() => updateMemberRoleAction(slug, m.id, role))}>
                                  {metaOf(ROLE_META, role).label}
                                </DropdownMenuItem>
                              ))}
                            <DropdownMenuSeparator />
                          </>
                        ) : null}
                        {isClientWorkspace ? <DropdownMenuItem onSelect={() => setEditing(m)}>Profiles and contact</DropdownMenuItem> : null}
                        {isClientWorkspace && m.role === "client_admin" && !m.isOwner && m.status === "active" ? (
                          <DropdownMenuItem icon={Crown} onSelect={() => run(() => transferOwnershipAction(slug, m.id), `Make ${m.name} the owner of this workspace?`)}>
                            Make owner
                          </DropdownMenuItem>
                        ) : null}
                        {!m.isOwner ? (
                          m.status === "suspended" ? (
                            <DropdownMenuItem onSelect={() => run(() => reinstateMemberAction(slug, m.id))}>Reinstate</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => run(() => suspendMemberAction(slug, m.id), `Suspend ${m.name}? They lose access immediately; their open tasks return to the unassigned queue.`)}>
                              Suspend
                            </DropdownMenuItem>
                          )
                        ) : null}
                        {!m.isOwner ? (
                          <DropdownMenuItem icon={UserMinus} destructive onSelect={() => run(() => removeMemberAction(slug, m.id), `Remove ${m.name} from this workspace?`)}>
                            Remove
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TD>
              ) : null}
            </TR>
          ))}
        </TBody>
      </Table>
      {editing ? <ProfileDialog slug={slug} member={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}

function ProfileDialog({ slug, member, onClose }: { slug: string; member: Member; onClose: () => void }) {
  const router = useRouter();
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader title={`${member.name}: profiles and contact`} description="Profiles add or limit powers on top of the role. Only admins manage settings and members." />
        <ActionForm
          action={updateMemberProfileAction.bind(null, slug, member.id)}
          onSuccess={() => {
            onClose();
            router.refresh();
          }}
          className="contents"
        >
          {({ error }) => (
            <>
              <DialogBody className="space-y-4">
                <FormError error={error} />
                <fieldset className="space-y-2">
                  <legend className="text-[13px] font-medium text-ink">Profiles</legend>
                  {SETTABLE_PROFILES.map((p) => (
                    <label key={p} className="flex items-center gap-2 text-[13px] text-muted">
                      <input type="checkbox" name="profiles" value={p} defaultChecked={member.profiles.includes(p)} />
                      {PROFILE_LABEL[p]}
                      <span className="text-ghost">
                        {p === "approver" ? "approves ideas, scripts and finished pieces" : p === "viewer" ? "read-only" : p === "commercial" ? "pipeline and results" : "adds input, uploads, records"}
                      </span>
                    </label>
                  ))}
                </fieldset>
                <label className="flex items-center gap-2 text-[13px] text-muted">
                  <input type="checkbox" name="isExpert" defaultChecked={member.isExpert} />
                  An expert whose voice Threadline writes in
                </label>
                <Field label="How they speak" htmlFor="voiceNotes" optional hint="For writing in this expert's voice: tone, phrases they use, things they would never say.">
                  <Textarea id="voiceNotes" name="voiceNotes" rows={3} defaultValue={member.voiceNotes ?? ""} />
                </Field>
                <Field label="Decision contact" htmlFor="contactRole">
                  <NativeSelect id="contactRole" name="contactRole" defaultValue={member.contactRole ?? "none"}>
                    <option value="none">Not a contact</option>
                    <option value="primary">Primary contact</option>
                    <option value="backup">Backup contact</option>
                  </NativeSelect>
                </Field>
              </DialogBody>
              <DialogFooter>
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <SubmitButton variant="primary">Save</SubmitButton>
              </DialogFooter>
            </>
          )}
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

export function InviteButton({ slug, assignableRoles, isClientWorkspace }: { slug: string; assignableRoles: string[]; isClientWorkspace: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [link, setLink] = React.useState<string | null>(null);
  const router = useRouter();
  if (!assignableRoles.length) return null;
  return (
    <>
      <Button icon={UserPlus} onClick={() => { setLink(null); setOpen(true); }}>
        Invite someone
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader title="Invite someone" description="They choose their own password when they accept. Nothing is created until then." />
          {link ? (
            <DialogBody className="space-y-3">
              <p className="text-[13px] text-muted">Email is not configured on this deployment. Send this link to them directly; it works once and expires in seven days.</p>
              <code className="block break-all rounded-md border border-line px-3 py-2 text-[12px] text-ink">{link}</code>
              <DialogFooter>
                <Button variant="primary" onClick={() => setOpen(false)}>Done</Button>
              </DialogFooter>
            </DialogBody>
          ) : (
            <ActionForm
              action={inviteAction.bind(null, slug)}
              onSuccess={(d: unknown) => {
                router.refresh();
                const shared = (d as { link: string | null } | undefined)?.link;
                if (shared) setLink(shared);
                else setOpen(false);
              }}
              className="contents"
            >
              {({ fieldErrors, error }) => (
                <>
                  <DialogBody className="space-y-4">
                    <FormError error={error} />
                    <Field label="Name" htmlFor="inviteName" error={fieldErrors.name}>
                      <Input id="inviteName" name="name" required autoFocus />
                    </Field>
                    <Field label="Email" htmlFor="inviteEmail" error={fieldErrors.email}>
                      <Input id="inviteEmail" name="email" type="email" required />
                    </Field>
                    <Field label="Title" htmlFor="inviteTitle" optional>
                      <Input id="inviteTitle" name="title" placeholder="Partner" />
                    </Field>
                    <Field label="Role" htmlFor="inviteRole">
                      <NativeSelect id="inviteRole" name="role" defaultValue={assignableRoles.includes("client_member") ? "client_member" : assignableRoles[0]}>
                        {assignableRoles.map((role) => (
                          <option key={role} value={role}>
                            {metaOf(ROLE_META, role).label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    {isClientWorkspace ? (
                      <fieldset className="space-y-2">
                        <legend className="text-[13px] font-medium text-ink">Profiles</legend>
                        {SETTABLE_PROFILES.map((p) => (
                          <label key={p} className="flex items-center gap-2 text-[13px] text-muted">
                            <input type="checkbox" name="profiles" value={p} defaultChecked={p === "contributor"} />
                            {PROFILE_LABEL[p]}
                          </label>
                        ))}
                        <label className="flex items-center gap-2 text-[13px] text-muted">
                          <input type="checkbox" name="isExpert" />
                          An expert whose voice Threadline writes in
                        </label>
                      </fieldset>
                    ) : null}
                  </DialogBody>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <SubmitButton variant="primary" icon={MailPlus}>
                      Send invitation
                    </SubmitButton>
                  </DialogFooter>
                </>
              )}
            </ActionForm>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PendingInvitations({ slug, invitations, canManage }: { slug: string; invitations: PendingInvitation[]; canManage: boolean }) {
  const { pending, run } = useRun();
  const router = useRouter();
  const [shared, setShared] = React.useState<{ id: string; link: string } | null>(null);
  const resend = async (id: string) => {
    const r = await resendInvitationAction(slug, id);
    if (!r.ok) return toast.error(r.error);
    toast.success(r.message ?? "Sent again.");
    if (r.data.link) setShared({ id, link: r.data.link });
    router.refresh();
  };
  if (!invitations.length) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-[14px] font-medium text-ink">Invitations</h2>
      <ul className="divide-y divide-line rounded-lg border border-line">
        {invitations.map((i) => {
          const expired = i.state === "expired" || new Date(i.expiresAt).getTime() < Date.now();
          return (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-[13px] text-ink">
                  {i.name} <span className="text-ghost">· {i.email}</span>
                </p>
                <p className="text-[12px] text-ghost">
                  {metaOf(ROLE_META, i.role).label} · {expired ? "expired" : `expires ${relativeTime(new Date(i.expiresAt))}`} · sent {i.sentCount} time{i.sentCount === 1 ? "" : "s"}
                </p>
              </div>
              {canManage ? (
                <div className="flex gap-1">
                  <Button size="xs" variant="ghost" icon={RotateCw} disabled={pending} onClick={() => void resend(i.id)}>
                    Resend
                  </Button>
                  <Button size="xs" variant="ghost" icon={X} disabled={pending} onClick={() => run(() => revokeInvitationAction(slug, i.id), `Withdraw the invitation to ${i.name}?`)}>
                    Revoke
                  </Button>
                </div>
              ) : null}
              {shared?.id === i.id ? <code className="block w-full break-all rounded-md border border-line px-3 py-2 text-[12px] text-ink">{shared.link}</code> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
