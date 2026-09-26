import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { currentUser } from "@/lib/auth/guard";
import { inspectInvitation } from "@/lib/team/invitations";
import { AcceptInvitationForm } from "./accept-form";

export const metadata: Metadata = { title: "Accept your invitation", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Invitation landing (TEAM-03). Viewing the link changes nothing; acceptance is
 * a POST from the form. What the form asks for depends on who is looking.
 */
export default async function InvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const [view, me] = await Promise.all([inspectInvitation(token), currentUser()]);
  const here = `/invite?token=${encodeURIComponent(token)}`;

  let body: React.ReactNode;
  if (!view.ok) {
    const why = { invalid: "It is not a valid invitation link, or it has already been used.", expired: "It has expired. Ask whoever invited you for a new one.", revoked: "It was withdrawn.", accepted: "It has already been used." }[view.reason];
    body = (
      <>
        <h1 className="text-[17px] font-medium text-ink">This invitation cannot be used</h1>
        <p className="mt-1.5 text-[13px] text-muted">
          {why}{" "}
          <Link href="/login" className="text-accent hover:text-accent-bright">Sign in instead.</Link>
        </p>
      </>
    );
  } else if (me && me.email.toLowerCase() !== view.email) {
    body = (
      <>
        <h1 className="text-[17px] font-medium text-ink">Signed in as someone else</h1>
        <p className="mt-1.5 text-[13px] text-muted">
          This invitation to {view.workspace} is for {view.email}, but you are signed in as {me.email}. Sign out, then open the link again.
        </p>
      </>
    );
  } else if (me) {
    body = (
      <>
        <h1 className="text-[17px] font-medium text-ink">Join {view.workspace}</h1>
        <p className="mt-1.5 text-[13px] text-muted">You are signed in as {me.email}. Accept to add {view.workspace} to your workspaces.</p>
        <AcceptInvitationForm token={token} mode="join" />
      </>
    );
  } else if (view.accountExists) {
    body = (
      <>
        <h1 className="text-[17px] font-medium text-ink">Join {view.workspace}</h1>
        <p className="mt-1.5 text-[13px] text-muted">You already have a Threadline account for {view.email}. Sign in, and you will come back here to accept.</p>
        <Link href={`/login?next=${encodeURIComponent(here)}`} className="mt-5 inline-flex min-h-11 items-center text-accent hover:text-accent-bright">
          Sign in to accept
        </Link>
      </>
    );
  } else {
    body = (
      <>
        <h1 className="text-[17px] font-medium text-ink">Welcome, {view.name.split(" ")[0]}</h1>
        <p className="mt-1.5 text-[13px] text-muted">You have been invited to {view.workspace}. Choose a password to create your account.</p>
        <AcceptInvitationForm token={token} mode="create" />
      </>
    );
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Wordmark size="lg" />
        </div>
        <div className="rounded-xl border border-line bg-elevated p-6 shadow-lg">{body}</div>
      </div>
    </main>
  );
}
