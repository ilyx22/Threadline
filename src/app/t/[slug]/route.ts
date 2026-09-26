import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { referrerHost } from "@/lib/domain/tracked-link";

/**
 * The tracked redirect.
 *
 * A visitor follows `/t/<slug>`, the click is recorded against the content that
 * carried the link, and they are sent on to the client's real destination. This
 * is what lets Threadline measure content it did not publish: the client posts
 * manually, the caption carries a Threadline URL, and the touchpoint is still
 * ours to observe.
 *
 * DELIBERATE PROPERTIES
 *
 * - **The destination is never taken from the request.** It comes from the
 *   stored row, which was validated when an operator wrote it. A redirector
 *   that accepts a target from the URL is an open redirect, and one wearing a
 *   company's own domain is a phishing primitive.
 * - **Identity is a random first-party token and nothing else.** No
 *   fingerprinting, no device signals, no cross-device stitching. The cookie
 *   says "these clicks were the same browser". It cannot say who, and the model
 *   never claims it can.
 * - **The redirect happens even if recording fails.** A person clicking a link
 *   in a post is not part of Threadline's operation and should never see its
 *   internals. A lost touchpoint is a gap in a measurement; a broken link is a
 *   broken promise to the client's audience.
 * - **Only the referring host is kept.** A full referring URL can carry personal
 *   data in its query string, and the host answers the only useful question.
 */

const VISITOR_COOKIE = "tl_v";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const link = await prisma.trackedLink.findUnique({
    where: { slug },
    select: {
      id: true,
      orgId: true,
      active: true,
      destinationUrl: true,
      contentItemId: true,
      publishRecordId: true,
      platform: true,
      campaign: true,
    },
  });

  // An unknown or retired link tells the visitor nothing about Threadline, its
  // clients, or whether the slug ever existed.
  if (!link || !link.active) {
    return new NextResponse("This link is no longer active.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  // ATT-02: the visitor cookie is a non-essential identifier, so it fails
  // closed. It is set only when consent is evidenced (a tl_consent=1 cookie on
  // Threadline's domain) or the owner has documented a lawful basis in
  // configuration, and never when the browser sends Global Privacy Control.
  // Without it, each click still counts, under a one-off identifier.
  const mayIdentify = visitorCookieAllowed(request);
  const existingToken = mayIdentify ? request.cookies.get(VISITOR_COOKIE)?.value : undefined;
  const token = isPlausibleToken(existingToken) ? existingToken : randomBytes(16).toString("base64url");

  const response = NextResponse.redirect(link.destinationUrl, {
    status: 302,
    // A tracked link is not a permanent move: the destination can legitimately
    // change, and a 301 would be cached by browsers past that change.
  });

  if (mayIdentify) {
    response.cookies.set(VISITOR_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }

  // Never let a measurement failure break somebody else's audience experience.
  try {
    await record(link, token, referrerHost(request.headers.get("referer")));
  } catch (error) {
    console.error("[tracked-link] failed to record touchpoint", slug, error);
  }

  return response;
}

function isPlausibleToken(value: string | undefined): value is string {
  return typeof value === "string" && value.length >= 16 && value.length <= 64 && /^[A-Za-z0-9_-]+$/.test(value);
}

async function record(
  link: {
    id: string;
    orgId: string;
    contentItemId: string | null;
    publishRecordId: string | null;
    platform: string | null;
    campaign: string | null;
  },
  token: string,
  referrer: string | null,
) {
  const now = new Date();

  const visitor = await prisma.visitor.upsert({
    where: { orgId_token: { orgId: link.orgId, token } },
    create: { orgId: link.orgId, token, firstSeenAt: now, lastSeenAt: now },
    update: { lastSeenAt: now },
    select: { id: true },
  });

  await prisma.touchpoint.create({
    data: {
      orgId: link.orgId,
      visitorId: visitor.id,
      trackedLinkId: link.id,
      contentItemId: link.contentItemId,
      publishRecordId: link.publishRecordId,
      kind: "click",
      platform: link.platform,
      campaign: link.campaign,
      referrerHost: referrer,
      source: "native",
      occurredAt: now,
    },
  });
}

/** ATT-02: may this click carry a persistent visitor identifier? */
function visitorCookieAllowed(request: NextRequest): boolean {
  if (request.headers.get("sec-gpc") === "1") return false;
  if (request.cookies.get("tl_consent")?.value === "1") return true;
  return process.env.TRACKED_LINK_VISITOR_COOKIE === "lawful-basis-documented";
}

