import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { isInternalUser, requireUser } from "@/lib/auth/guard";
import { mfaRequiredForStaff } from "@/lib/auth/mfa";
import { listSessions } from "@/lib/auth/session";
import { credentialStorageConfigured } from "@/lib/security/secret-box";
import { MfaPanel, NotificationsPanel, SessionsPanel } from "./account-client";
import { prisma } from "@/lib/db/client";

export const metadata: Metadata = { title: "Account security", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** The signed-in person's own security: two-factor and sessions (SEC-07, SEC-08). */
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ mfa?: string }> }) {
  const { mfa } = await searchParams;
  const user = await requireUser("/account");
  const [sessions, staff] = await Promise.all([listSessions(user.id), isInternalUser(user)]);
  const required = staff && mfaRequiredForStaff();
  const memberships = await prisma.membership.findMany({ where: { userId: user.id, status: "active", org: { kind: "client" } }, select: { orgId: true, org: { select: { name: true } } } });
  const prefRows = await prisma.notificationPreference.findMany({ where: { userId: user.id } });
  const prefs = memberships.map((m) => {
    const p = prefRows.find((r) => r.orgId === m.orgId);
    return { orgId: m.orgId, orgName: m.org.name, email: p?.email ?? "off", quietStart: p?.quietStart ?? null, quietEnd: p?.quietEnd ?? null, snoozedUntil: p?.snoozedUntil ? p.snoozedUntil.toISOString() : null };
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Wordmark size="md" />
        <Link href={staff ? "/admin" : "/app"} className="inline-flex min-h-11 items-center gap-1.5 text-[13px] text-muted hover:text-ink">
          <ArrowLeft className="size-3.5" aria-hidden /> Back
        </Link>
      </div>
      <h1 className="text-[22px] font-medium text-ink">Account security</h1>
      <p className="mt-1.5 text-[13px] text-muted">
        {user.name} · {user.email}
      </p>

      {mfa === "required" && !user.mfaEnabled ? (
        <p role="alert" className="mt-6 rounded-md border border-line bg-elevated px-3 py-2.5 text-[13px] text-ink">
          Staff tools need two-factor authentication. Turn it on below to continue.
        </p>
      ) : null}

      <MfaPanel enabled={user.mfaEnabled} required={required} storageReady={credentialStorageConfigured()} />
      <NotificationsPanel prefs={prefs} />
      <SessionsPanel
        currentId={user.sessionId}
        sessions={sessions.map((s) => ({
          id: s.id,
          device: s.userAgent,
          createdAt: s.createdAt.toISOString(),
          lastSeenAt: s.lastSeenAt?.toISOString() ?? null,
          verified: Boolean(s.mfaVerifiedAt),
        }))}
      />
    </main>
  );
}
