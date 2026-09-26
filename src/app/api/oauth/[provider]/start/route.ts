import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAccess } from "@/lib/auth/guard";
import { getConnector } from "@/lib/integrations/connectors";
import { startAuthorization } from "@/lib/integrations/oauth";
import { appUrl } from "@/lib/app-url";

export const dynamic = "force-dynamic";

/**
 * GET /api/oauth/{provider}/start?org={slug} (INT-01). A workspace admin (or
 * staff) begins connecting a platform account: a one-time state bound to the
 * workspace, PKCE where the provider supports it, then off to the provider.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const slug = req.nextUrl.searchParams.get("org") ?? "";
  const back = (q: string) => NextResponse.redirect(`${appUrl()}/app/${encodeURIComponent(slug)}/settings/integrations?${q}`);
  const connector = getConnector(provider);
  if (!connector) return back(`oauth_error=${encodeURIComponent("That platform cannot be connected automatically.")}`);
  const ctx = await requireOrgAccess(slug, "workspace.settings");
  const config = connector.authConfig();
  if (!config) return back(`oauth_error=${encodeURIComponent(`${connector.label} is not set up on this deployment yet.`)}`);
  const started = await startAuthorization({ orgId: ctx.org.id, userId: ctx.user.id, config, returnTo: `/app/${ctx.org.slug}/settings/integrations` });
  if (!started.ok) return back(`oauth_error=${encodeURIComponent(started.reason)}`);
  return NextResponse.redirect(started.authorizeUrl);
}
