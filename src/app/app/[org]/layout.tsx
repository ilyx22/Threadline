import { notFound, redirect } from "next/navigation";
import { SYNTHETIC_EXPLANATION, SYNTHETIC_LABEL } from "@/lib/domain/synthetic";
import { TooltipProvider } from "@/components/ui/menu";
import { Sidebar } from "@/components/app/sidebar";
import { TopBar } from "@/components/app/topbar";
import { CommandMenu } from "@/components/app/command-menu";
import { DemoTour } from "@/components/app/demo-tour";
import { accessibleOrgs, requireOrgAccess, requireOrgPage } from "@/lib/auth/guard";
import { ROLE_META, metaOf } from "@/lib/domain/enums";
import { workspaceNav } from "@/lib/navigation";
import { seesOperatorSurface } from "@/lib/domain/visibility";
import { prisma } from "@/lib/db/client";
import { listNotifications, unreadNotificationCount, searchWorkspace } from "@/lib/data/workspace";
import { approvalCount } from "@/lib/data/client-surface";
import { logoutAction } from "@/lib/actions/auth";
import { markNotificationsReadAction } from "@/lib/actions/workspace";

/**
 * Client portal shell.
 *
 * Resolves the caller and the organisation once per request through
 * `requireOrgAccess`, then filters navigation by the caller's capabilities using
 * the same matrix the server guards use — so a hidden item is also a denied route.
 */
export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ org: string }>;
}) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "workspace.view");

  // An unfinished onboarding takes precedence over the app itself.
  if (ctx.org.onboardingStage !== "complete" && !ctx.isInternal) {
    const session = await prisma.onboardingSession.findUnique({
      where: { orgId: ctx.org.id },
      select: { status: true },
    });
    if (session && session.status !== "complete") {
      redirect(`/onboarding/${slug}`);
    }
  }

  const [orgs, notifications, unreadCount, openTasks, counts] = await Promise.all([
    accessibleOrgs(ctx.user),
    listNotifications(ctx.org.id, ctx.user.id, ctx.role, 12),
    unreadNotificationCount(ctx.org.id, ctx.user.id, ctx.role),
    prisma.task.count({
      where: { orgId: ctx.org.id, audience: "client", status: { in: ["open", "in_progress"] } },
    }),
    navCounts(ctx.org.id),
  ]);

  // One system, two experiences. Threadline staff get the full loop; a client
  // gets the surface described in src/lib/domain/visibility.ts. Both are the
  // same application against the same tenant — only the chrome differs, and the
  // routes underneath deny independently of what the nav shows.
  const surface = seesOperatorSurface(ctx.role) ? "operator" : "client";

  // Only the permitted keys are handed to the client chrome; the icon-bearing
  // definition is rebuilt there (see the note on Sidebar).
  const navKeys = workspaceNav(slug, surface)
    .filter((item) => ctx.can(item.capability)) // profiles narrow or widen a role (TEAM-01)
    .map((item) => item.key);
  const roleLabel = metaOf(ROLE_META, ctx.role).label;

  async function search(query: string) {
    "use server";
    // Re-resolves the caller server-side: the client cannot widen this scope.
    const inner = await requireOrgAccess(slug, "workspace.view");
    // Role re-resolved server-side: the caller cannot widen their own scope.
    return searchWorkspace(inner.org.id, slug, query, inner.role);
  }

  async function markRead() {
    "use server";
    await markNotificationsReadAction(slug);
  }

  async function logout() {
    "use server";
    await logoutAction();
  }

  if (navKeys.length === 0) notFound();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-dvh">
        <Sidebar
          navKeys={navKeys}
          surface={surface}
          orgs={orgs}
          currentSlug={slug}
          currentName={ctx.org.name}
          roleLabel={roleLabel}
          counts={counts}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            navKeys={navKeys}
            surface={surface}
            user={{
              name: ctx.user.name,
              email: ctx.user.email,
              avatarHue: ctx.user.avatarHue,
              title: ctx.user.title,
            }}
            orgSlug={slug}
            roleLabel={roleLabel}
            isInternal={ctx.isInternal}
            notifications={notifications}
            unreadCount={unreadCount}
            taskCount={openTasks}
            onMarkRead={markRead}
            onLogout={logout}
            commandMenu={<CommandMenu slug={slug} surface={surface} search={search} />}
            tourControl={<DemoTour slug={slug} />}
          />
          {/*
            A synthetic workspace is a dry run against a real company used as a
            public reference. It runs through the real system on purpose, which
            is exactly why it needs a marker that is impossible to miss and
            impossible to screenshot around.
          */}
          {ctx.org.synthetic ? (
            <div className="border-b border-warning/25 bg-warning-soft px-4 py-2.5 lg:px-6">
              <p className="mx-auto w-full max-w-[1400px] text-[12.5px] leading-relaxed text-warning">
                <span className="font-medium">{SYNTHETIC_LABEL}.</span> {SYNTHETIC_EXPLANATION}
              </p>
            </div>
          ) : null}
          <main className="flex-1 px-4 py-6 lg:px-6 lg:py-8">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

/** Counts shown as sidebar badges — only where a number demands attention. */
async function navCounts(orgId: string) {
  const [awaitingApproval, readyToRecord, approvals] = await Promise.all([
    prisma.contentItem.count({ where: { orgId, stage: "in_review" } }),
    prisma.script.count({ where: { orgId, qaState: "approved", contentItems: { none: {} } } }),
    // The same count the Approvals page itself renders. Computing it twice from
    // different queries is how a badge ends up disagreeing with the list it
    // points at, which teaches people to stop trusting the badge.
    approvalCount(orgId),
  ]);
  return {
    production: awaitingApproval + readyToRecord,
    content: awaitingApproval,
    recording: readyToRecord,
    approvals,
  } as Record<string, number>;
}
