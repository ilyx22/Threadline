import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { currentUser } from "@/lib/auth/guard";
import { getStorage, orgIdFromStoragePath } from "@/lib/storage";

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
    select: { id: true, fileName: true, mimeType: true, orgId: true },
  });
  if (!asset) {
    return new NextResponse("Not found", { status: 404 });
  }

  const allowed = user.isSuperAdmin
    ? true
    : Boolean(
        await prisma.membership.findFirst({
          where: {
            userId: user.id,
            OR: [{ orgId: asset.orgId }, { role: { in: ["internal_operator", "super_admin"] }, org: { kind: "internal" } }],
          },
          select: { id: true },
        }),
      );

  if (!allowed) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const buffer = await getStorage().get(storagePath);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": asset.mimeType ?? "application/octet-stream",
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `inline; filename="${encodeURIComponent(asset.fileName ?? "file")}"`,
        // Private: these are tenant files, never shared caches.
        "Cache-Control": "private, max-age=0, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("File is no longer available", { status: 404 });
  }
}
