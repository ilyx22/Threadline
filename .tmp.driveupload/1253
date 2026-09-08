import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db/client";

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

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? null;

  await prisma.session.create({
    data: {
      token: digest(token),
      userId,
      expiresAt,
      userAgent: headerList.get("user-agent")?.slice(0, 300) ?? null,
      ipHash: hashIp(ip),
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
};

/** Resolve the current user from the session cookie. Returns null when anonymous. */
export async function getSessionUser(): Promise<SessionUser | null> {
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

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    title: session.user.title,
    avatarHue: session.user.avatarHue,
    isSuperAdmin: session.user.isSuperAdmin,
  };
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
