import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { currentUser, isInternalUser } from "@/lib/auth/guard";
import { auditInternal } from "@/lib/auth/audit";
import { getConnector } from "@/lib/integrations/connectors";
import { consumeState, exchangeCode, persistConnection } from "@/lib/integrations/oauth";
import { appUrl } from "@/lib/app-url";
import { reportError } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * GET /api/oauth/{provider}/callback (INT-01). The state is single use and
 * bound to the workspace that started it; the person completing it must be
 * signed in and allowed to change that workspace's settings. Granted scopes
 * are recorded as granted, so a partial grant is shown as partial.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const q = req.nextUrl.searchParams;
  const fallback = `${appUrl()}/app`;
  const state = await consumeState(q.get("state") ?? "");
  if ("error" in state) return NextResponse.redirect(`${fallback}?oauth_error=${encodeURIComponent(state.error)}`);
  const org = await prisma.organization.findUnique({ where: { id: state.orgId }, select: { slug: true } });
  const back = (query: string) => NextResponse.redirect(`${appUrl()}${state.returnTo ?? `/app/${org?.slug ?? ""}/settings/integrations`}?${query}`);
  if (state.provider !== provider) return back(`oauth_error=${encodeURIComponent("Provider mismatch.")}`);
  if (q.get("error")) return back(`oauth_error=${encodeURIComponent(q.get("error_description") ?? q.get("error") ?? "The platform refused the connection.")}`);

  const user = await currentUser();
  if (!user) return back(`oauth_error=${encodeURIComponent("Sign in again, then reconnect.")}`);
  const member = await prisma.membership.findUnique({ where: { userId_orgId: { userId: user.id, orgId: state.orgId } }, select: { role: true, status: true } });
  const allowed = (member?.status === "active" && member.role === "client_admin") || (await isInternalUser(user));
  if (!allowed) return back(`oauth_error=${encodeURIComponent("Only a workspace admin can connect accounts.")}`);

  const connector = getConnector(provider);
  const config = connector?.authConfig();
  if (!connector || !config) return back(`oauth_error=${encodeURIComponent("That platform is not set up on this deployment.")}`);
  const exchanged = await exchangeCode({ config, code: q.get("code") ?? "", verifier: state.verifier });
  if (!exchanged.ok) return back(`oauth_error=${encodeURIComponent(exchanged.reason)}`);

  // The account to publish as (LinkedIn member, Threads profile, Instagram account, Facebook Page).
  let accountLabel: string | null = null;
  if (connector.resolveAccount && !exchanged.token.externalAccountId) {
    const account = await connector.resolveAccount(exchanged.token.accessToken).catch(() => null);
    if (!account) return back(`oauth_error=${encodeURIComponent(`Connected, but ${connector.label} did not say which account to publish as. Check the account has what publishing needs (for example a Page or a professional account), then reconnect.`)}`);
    exchanged.token.externalAccountId = account.id;
    if (account.accessToken) exchanged.token.accessToken = account.accessToken;
    accountLabel = account.label ?? null;
  }
  const granted = new Set(exchanged.token.scopesGranted);
  const has = (scopes: string[]) => (scopes.length === 0 ? "none" : scopes.every((s) => granted.has(s)) ? "available" : scopes.some((s) => granted.has(s)) ? "partial" : "missing_scope");
  try {
    await persistConnection({
      orgId: state.orgId,
      provider,
      token: exchanged.token,
      scopesRequested: state.scopesRequested,
      publishCapability: has(connector.scopes.publish),
      analyticsCapability: has(connector.scopes.analytics),
      reviewStatus: connector.gates.length ? "review_may_be_required" : "not_required",
      restrictions: connector.gates,
      accountLabel,
    });
  } catch (error) {
    await reportError(error, { event: "oauth.persist", provider });
    return back(`oauth_error=${encodeURIComponent("The connection could not be stored. Credential encryption may not be configured.")}`);
  }
  await auditInternal(user.id, { orgId: state.orgId, action: "integration.connect", entityType: "integration", entityId: provider, summary: `Connected ${connector.label} (${[...granted].length} scope(s) granted)` });
  return back(`connected=${encodeURIComponent(provider)}`);
}
