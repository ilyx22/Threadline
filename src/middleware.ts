import { NextResponse, type NextRequest } from "next/server";

/**
 * Cheap cookie presence check to keep anonymous users out of app chrome and
 * give them a sensible redirect.
 *
 * This is a UX optimisation, NOT the security boundary. Every protected page and
 * every server action independently resolves the session and the caller's
 * membership through `src/lib/auth/guard.ts`. Do not add authorisation logic
 * here — middleware cannot query the database and must not be trusted.
 */

const PROTECTED_PREFIXES = ["/app", "/admin", "/onboarding", "/account"];
const SESSION_COOKIE = "threadline_session";

/**
 * Set by the guard when it has checked the database and found no valid session
 * behind the cookie. Middleware cannot make that check itself, so this is how
 * it learns the difference between a cookie and a session.
 */
const EXPIRED_FLAG = "session";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && hasSession) {
    // A cookie the server has already rejected — expired, revoked, or belonging
    // to a deleted user. Without this branch the two redirects point at each
    // other forever: middleware sends the cookie-holder to /app, the guard
    // finds no session and sends them back, and the person can never reach the
    // form to sign in again. Clear the dead cookie and render the page.
    if (request.nextUrl.searchParams.get(EXPIRED_FLAG) === "expired") {
      const response = NextResponse.next();
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }

    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and the file API, which does its own
     * per-request membership check.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/files|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
