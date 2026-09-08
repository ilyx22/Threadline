import { redirect } from "next/navigation";
import { accessibleOrgs, isInternalUser, requireUser } from "@/lib/auth/guard";

/**
 * Workspace entry point.
 *
 * `/app` carries no UI of its own — it resolves where this particular caller
 * should land and sends them there.
 *
 * It exists because middleware cannot: middleware runs without database access,
 * so when it redirects a signed-in user away from `/login` the only destination
 * it can name is a static one. Without this route that redirect pointed at a
 * path with no page behind it, and every signed-in user who opened the login
 * screen got a 404. The resolution has to happen somewhere that can query
 * membership, which means here.
 */
export default async function WorkspaceEntryPage() {
  const user = await requireUser("/app");

  // Threadline staff work from the admin portal by default; they reach a client
  // workspace by choosing one, not by being dropped into an arbitrary tenant.
  if (await isInternalUser(user)) {
    redirect("/admin");
  }

  const orgs = await accessibleOrgs(user);
  const first = orgs[0];

  if (!first) {
    // Authenticated, but a member of nothing. An explanation, not an error.
    redirect("/no-access?area=workspace");
  }

  redirect(`/app/${first.slug}`);
}
