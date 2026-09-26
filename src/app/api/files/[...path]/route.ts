import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { currentUser } from "@/lib/auth/guard";
import { getStorage, orgIdFromStoragePath } from "@/lib/storage";
import { servingHeaders } from "@/lib/storage/sniff";
import { assetInScope } from "@/lib/team/scope";

/**
 * Private file access.
 *
 * Uploaded files are NEVER served from a public static path. Every read
 * re-resolves the caller's session and confirms they hold a membership in the
 * organisation that owns the file — a leaked path is not enough to read it.
 *
 * See docs/ARCHITECTURE.md ADR-004.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const storagePath = path.join("/");

  const user = await currentUser();
  if (!user) {
    return new NextResponse("Not authenticated", { status: 401 });
  }

  const orgId = orgIdFromStoragePath(storagePath);
  if (!orgId) {
    return new NextResponse("Not found", { status: 404 });
  }

  // The asset row is the authority on ownership; the path alone is not trusted.
  const asset = await prisma.asset.findFirst({
    where: { orgId, storagePath },
    select: { id: true, fileName: true, mimeType: true, orgId: true, contentItemId: true, uploadedById: true },
  });
  if (!asset) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Only an ACTIVE membership counts (TEAM-05: a suspended member reads
  // nothing), and a contractor reads only the files of pieces assigned to
  // them or that they uploaded (TEAM-09).
  let allowed = user.isSuperAdmin;
  if (!allowed) {
    const staff = await prisma.membership.findFirst({
      where: { userId: user.id, status: "active", role: { in: ["internal_operator", "super_admin"] }, org: { kind: "internal" } },
      select: { id: true },
    });
    if (staff) allowed = true;
    else {
      const member = await prisma.membership.findFirst({ where: { userId: user.id, orgId: asset.orgId, status: "active" }, select: { role: true } });
      allowed = Boolean(member) && (member!.role !== "editor" || (await assetInScope(asset.orgId, user.id, member!.role, asset)));
    }
  }

  if (!allowed) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const buffer = await getStorage().get(storagePath);
    // SEC-02: only raster images, video and audio render inline; everything
    // else (including any legacy SVG) downloads with a neutral type, and every
    // response is sandboxed so a stored file cannot run script on this origin.
    return new NextResponse(new Uint8Array(buffer), {
      headers: servingHeaders(asset.mimeType, asset.fileName, buffer.byteLength),
    });
  } catch {
    return new NextResponse("File is no longer available", { status: 404 });
  }
}
