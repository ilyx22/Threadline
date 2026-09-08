"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
import { Avatar } from "@/components/ui/data";
import { Table, TBody, TD, TH, THead, TR, CellTitle } from "@/components/ui/table";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { Notice } from "@/components/ui/feedback";
import { RoleBadge } from "@/components/ui/status";
import { toast } from "@/components/ui/toast";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { addMemberAction, removeMemberAction, updateMemberRoleAction } from "@/lib/actions/workspace";
import { ROLE_META, metaOf } from "@/lib/domain/enums";
import { relativeTime } from "@/lib/utils/dates";

type Member = {
  id: string;
  name: string;
  email: string;
  title: string | null;
  role: string;
  avatarHue: number;
  isActive: boolean;
  lastSeenAt: string | null;
};

export function MembersTable({
  slug,
  members,
  canManage,
  currentUserId,
  assignableRoles,
}: {
  slug: string;
  members: Member[];
  canManage: boolean;
  currentUserId: string;
  assignableRoles: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const changeRole = (member: Member, role: string) => {
    startTransition(async () => {
      const result = await updateMemberRoleAction(slug, member.id, role);
      if (result.ok) {
        toast.success(result.message ?? "Role updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const remove = (member: Member) => {
    if (!window.confirm(`Remove ${member.name} from this workspace?`)) return;
    startTransition(async () => {
      const result = await removeMemberAction(slug, member.id);
      if (result.ok) {
        toast.success(result.message ?? "Member removed.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
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
        {members.map((member) => (
          <TR key={member.id}>
            <TD>
              <div className="flex items-center gap-3">
                <Avatar name={member.name} hue={member.avatarHue} />
                <CellTitle secondary={member.email}>
                  {member.name}
                  {member.id === currentUserId ? (
                    <span className="ml-2 text-[11px] text-ghost">you</span>
                  ) : null}
                </CellTitle>
              </div>
            </TD>
            <TD>
              <RoleBadge role={member.role} />
            </TD>
            <TD>{member.lastSeenAt ? relativeTime(new Date(member.lastSeenAt)) : "Never"}</TD>
            {canManage ? (
              <TD align="right">
                {member.id === currentUserId ? (
                  <span className="text-[12px] text-ghost">—</span>
                ) : (
                  <div className="flex items-center justify-end gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="xs" variant="ghost" disabled={pending}>
                          Change role
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Set role</DropdownMenuLabel>
                        {assignableRoles
                          .filter((r) => r !== member.role)
                          .map((role) => (
                            <DropdownMenuItem key={role} onSelect={() => changeRole(member, role)}>
                              {metaOf(ROLE_META, role).label}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      size="xs"
                      variant="ghost"
                      icon={UserMinus}
                      loading={pending}
                      onClick={() => remove(member)}
                    >
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                )}
              </TD>
            ) : null}
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

export function AddMemberButton({
  slug,
  assignableRoles,
}: {
  slug: string;
  assignableRoles: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <Button icon={UserPlus} onClick={() => setOpen(true)}>
        Add member
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader
            title="Add a member"
            description="Creates their account and grants access to this workspace."
          />
          <ActionForm
            action={addMemberAction.bind(null, slug)}
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
                  <Field label="Name" htmlFor="memberName" error={fieldErrors.name}>
                    <Input id="memberName" name="name" required autoFocus />
                  </Field>
                  <Field label="Email" htmlFor="memberEmail" error={fieldErrors.email}>
                    <Input id="memberEmail" name="email" type="email" required />
                  </Field>
                  <Field label="Title" htmlFor="memberTitle" optional>
                    <Input id="memberTitle" name="title" placeholder="Editor" />
                  </Field>
                  <Field label="Role" htmlFor="memberRole">
                    <NativeSelect id="memberRole" name="role" defaultValue="client_member">
                      {assignableRoles.map((role) => (
                        <option key={role} value={role}>
                          {metaOf(ROLE_META, role).label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field
                    label="Initial password"
                    htmlFor="memberPassword"
                    hint="At least 10 characters. Share it securely — they can use it immediately."
                    error={fieldErrors.password}
                  >
                    <Input id="memberPassword" name="password" type="text" required minLength={10} />
                  </Field>
                  <Notice tone="warning">
                    No invitation email is sent in this version. You will need to pass this password
                    to them yourself, through a channel you trust.
                  </Notice>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary">Add member</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}
