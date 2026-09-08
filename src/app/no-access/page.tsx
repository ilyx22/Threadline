import type { Metadata } from "next";
import { ShieldOff } from "lucide-react";
import { currentUser, accessibleOrgs } from "@/lib/auth/guard";
import { ButtonLink } from "@/components/ui/button";
import { Wordmark } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Not available",
  robots: { index: false, follow: false },
};

/**
 * Access denial.
 *
 * A plain explanation rather than an error screen. Lives outside the /admin and
 * /app layouts so rendering it can never re-trigger the guard that sent the user
 * here.
 */
export default async function NoAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; org?: string }>;
}) {
  const { area, org } = await searchParams;
  const user = await currentUser();
  const orgs = user ? await accessibleOrgs(user) : [];
  const home = org ? `/app/${org}` : orgs[0] ? `/app/${orgs[0].slug}` : "/app";

  const message =
    area === "admin"
      ? "The Threadline admin portal is only available to Threadline staff. Your account is a client account, which is why you cannot open it."
      : "Your role does not include access to that area. If you think it should, a workspace admin can change your role in Settings.";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Wordmark size="md" />
        </div>

        <div className="rounded-xl border border-line bg-elevated p-8">
          <div className="mx-auto mb-5 grid size-11 place-items-center rounded-lg border border-line bg-surface">
            <ShieldOff className="size-5 text-faint" aria-hidden />
          </div>
          <h1 className="text-[17px] font-medium text-ink">Not available to your account</h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{message}</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {user ? (
              <ButtonLink href={home} variant="primary">
                Back to your workspace
              </ButtonLink>
            ) : (
              <ButtonLink href="/login" variant="primary">
                Sign in
              </ButtonLink>
            )}
          </div>
        </div>

        <p className="mt-6 text-[12px] text-ghost">
          Permissions are enforced on the server. Nothing was exposed by this request.
        </p>
      </div>
    </main>
  );
}
