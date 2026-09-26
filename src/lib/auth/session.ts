import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db/client";
import { clientIpFrom } from "@/lib/security/client-ip";

export const SESSION_COOKIE = "threadline_session";
const SESSION_DAYS = 30;

/**
 * Opaque session tokens stored in the database.
 *
 * The cookie holds a high-entropy random token; the database stores only its
 * SHA-256 digest, so a database read alone cannot be replayed as a valid
 * session. Sessions are revocable (a row delete ends access immediately),
 * which a stateless JWT would not give us.
 */

function digest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function hashIp(ip: string | null) {
  if (!ip) return null;
  // Stored only to spot session anomalies; hashed so we do not retain raw IPs.
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

/**
 * Create a session. `mfaVerified` records whether the second factor was
 * checked; a user with two-factor on gets an unverified session at password
 * time, which counts as signed out everywhere except /login/verify (SEC-08).
 */
export async function createSession(userId: string, opts: { mfaVerified?: boolean } = {}) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  const headerList = await headers();
  const ip = clientIpFrom(headerList);

  await prisma.session.create({
    data: {
      token: digest(token),
      userId,
      expiresAt,
      userAgent: headerList.get("user-agent")?.slice(0, 300) ?? null,
      ipHash: hashIp(ip),
      mfaVerifiedAt: opts.mfaVerified ? new Date() : null,
      lastSeenAt: new Date(),
    },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  await prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } });

  return token;
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  title: string | null;
  avatarHue: number;
  isSuperAdmin: boolean;
  sessionId: string;
  mfaEnabled: boolean;
};

type SessionState = { user: SessionUser; pendingMfa: boolean } | null;

/** The session behind the cookie, including one still waiting for its second factor. */
export async function getSessionState(): Promise<SessionState> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token: digest(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (!session.user.isActive) return null;

  // Record activity for the device list, at most every five minutes.
  if (!session.lastSeenAt || Date.now() - session.lastSeenAt.getTime() > 5 * 60_000) {
    await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }

  const mfaEnabled = Boolean(session.user.mfaEnabledAt);
  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      title: session.user.title,
      avatarHue: session.user.avatarHue,
      isSuperAdmin: session.user.isSuperAdmin,
      sessionId: session.id,
      mfaEnabled,
    },
    pendingMfa: mfaEnabled && !session.mfaVerifiedAt,
  };
}

/**
 * Replace the current session with a fresh token (SEC-07): used when the
 * session's privilege changes (second factor verified or enrolled), so a token
 * observed before the change is worthless after it.
 */
export async function rotateSession(userId: string, opts: { mfaVerified: boolean }) {
  const jar = await cookies();
  const old = jar.get(SESSION_COOKIE)?.value;
  if (old) await prisma.session.deleteMany({ where: { token: digest(old), userId } });
  return createSession(userId, opts);
}

export async function listSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: [{ lastSeenAt: "desc" }, { createdAt: "desc" }],
    select: { id: true, userAgent: true, createdAt: true, lastSeenAt: true, mfaVerifiedAt: true },
  });
}

/** End one of the caller's own sessions (never another user's). */
export async function revokeSession(userId: string, sessionId: string) {
  const r = await prisma.session.deleteMany({ where: { id: sessionId, userId } });
  return r.count === 1;
}

export async function revokeOtherSessions(userId: string, keepSessionId: string) {
  const r = await prisma.session.deleteMany({ where: { userId, id: { not: keepSessionId } } });
  return r.count;
}

/**
 * Resolve the current user from the session cookie. Returns null when
 * anonymous AND when the session still awaits its second factor, so no data
 * route, file or action is reachable on a password alone.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const state = await getSessionState();
  return state && !state.pendingMfa ? state.user : null;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token: digest(token) } }).catch(() => {});
  }
  jar.delete(SESSION_COOKIE);
}

/** Housekeeping for expired rows. Called opportunistically on login. */
export async function pruneExpiredSessions() {
  await prisma.session
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch(() => {});
}
