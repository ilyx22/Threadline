import type { Metadata } from "next";
import { requireOrgPage } from "@/lib/auth/guard";
import { listInvitations, listMembers } from "@/lib/data/workspace";
import { ASSIGNABLE_CLIENT_ROLES, capabilitiesFor } from "@/lib/auth/roles";
import { ROLE_META, metaOf } from "@/lib/domain/enums";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Notice } from "@/components/ui/feedback";
import { MembersTable, InviteButton, PendingInvitations } from "./members-client";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "workspace.view");
  const canManage = ctx.can("workspace.members");
  const [members, invitations] = await Promise.all([listMembers(ctx.org.id), canManage ? listInvitations(ctx.org.id) : Promise.resolve([])]);
  const isClientWorkspace = ctx.org.kind === "client";

  // Client workspaces hold client roles only; staff roles live in the
  // internal organisation (SEC-01).
  const assignable: readonly string[] = ctx.org.kind === "internal"
    ? (ctx.role === "super_admin" ? ["internal_operator"] : [])
    : ASSIGNABLE_CLIENT_ROLES;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Members</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Who can see and do what. Permissions are enforced on the server, not just hidden in the
            interface — a role without a capability cannot perform the action by any route.
          </p>
        </div>
        {canManage ? (
          <InviteButton slug={slug} assignableRoles={[...assignable]} isClientWorkspace={isClientWorkspace} />
        ) : null}
      </header>

      <MembersTable
        slug={slug}
        canManage={canManage}
        currentUserId={ctx.user.id}
        assignableRoles={[...assignable]}
        isClientWorkspace={isClientWorkspace}
        members={members.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          title: m.title,
          role: m.role,
          avatarHue: m.avatarHue,
          lastSeenAt: m.lastSeenAt ? m.lastSeenAt.toISOString() : null,
          status: m.status,
          isOwner: m.isOwner,
          isExpert: m.isExpert,
          contactRole: m.contactRole,
          profiles: m.profiles,
        }))}
      />

      <PendingInvitations
        slug={slug}
        canManage={canManage}
        invitations={invitations.map((i) => ({ ...i, expiresAt: i.expiresAt.toISOString() }))}
      />

      <Card>
        <CardHeader
          title="What each role can do"
          eyebrow="Reference"
          description="One capability matrix drives both the interface and the server guards."
        />
        <CardBody className="pt-0">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(["client_admin", "client_member", "editor", "internal_operator", "super_admin"] as const).map(
              (role) => {
                const meta = metaOf(ROLE_META, role);
                const capabilities = capabilitiesFor(role);
                return (
                  <div key={role} className="rounded-lg border border-line bg-surface p-4">
                    <p className="text-[13px] font-medium text-ink">{meta.label}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">{meta.description}</p>
                    <p className="mt-2.5 text-[11.5px] text-ghost">
                      {capabilities.length} capabilities
                    </p>
                  </div>
                );
              },
            )}
          </div>
        </CardBody>
      </Card>

      <Notice tone="neutral" title="How access is provisioned">
        Threadline has no self-serve signup. People join by invitation and choose their own
        password when they accept. An invitation works once and expires after seven days;
        suspending or removing someone ends their access on their next click.
      </Notice>
    </div>
  );
}
