import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { inspectToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db/client";
import { PasswordForm } from "@/components/forms/password-form";
import { acceptInviteAction } from "@/lib/actions/account";

export const metadata: Metadata = { title: "Accept your invitation", robots: { index: false, follow: false } };

export default async function InvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const peek = await inspectToken(token, "invite");
  const user = peek.ok ? await prisma.user.findUnique({ where: { id: peek.userId }, select: { name: true } }) : null;
  const org = peek.ok && peek.orgId ? await prisma.organization.findUnique({ where: { id: peek.orgId }, select: { name: true } }) : null;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="hero-vignette pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Wordmark size="lg" />
        </div>
        <div className="rounded-xl border border-line bg-elevated p-6 shadow-lg">
          {peek.ok ? (
            <>
              <h1 className="text-[17px] font-medium text-ink">Welcome{user ? `, ${user.name.split(" ")[0]}` : ""}</h1>
              <p className="mt-1.5 text-[13px] text-muted">
                {org ? `You have been added to ${org.name}. ` : ""}Choose a password to finish setting up your account.
              </p>
              <PasswordForm token={token} action={acceptInviteAction} submitLabel="Set password and sign in" />
            </>
          ) : (
            <>
              <h1 className="text-[17px] font-medium text-ink">This invitation cannot be used</h1>
              <p className="mt-1.5 text-[13px] text-muted">
                {peek.reason === "expired" ? "It has expired — invitations last 72 hours. Ask your operator for a new one." : peek.reason === "used" ? "It has already been used." : "It is not a valid invitation link."}{" "}
                <Link href="/login" className="text-accent hover:text-accent-bright">Sign in instead.</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
