import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { currentUser } from "@/lib/auth/guard";
import { StorageError } from "@/lib/storage";
import { writeLocalPart } from "@/lib/storage/direct";

export const dynamic = "force-dynamic";

/**
 * PUT /api/uploads/{session}/parts/{n} (FILE-02): the part route used when
 * storage is local (development and tests). With S3 the browser sends parts
 * to the bucket instead. Only the person who opened the upload may send parts.
 */
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await context.params;
  const user = await currentUser();
  if (!user) return new NextResponse("Not authenticated", { status: 401 });
  const session = await prisma.uploadSession.findFirst({ where: { id, userId: user.id }, select: { orgId: true } });
  if (!session) return new NextResponse("Not found", { status: 404 });
  try {
    const body = Buffer.from(await req.arrayBuffer());
    const etag = await writeLocalPart({ orgId: session.orgId, userId: user.id }, id, Number(n), body);
    return new NextResponse(null, { status: 200, headers: { etag } });
  } catch (e) {
    if (e instanceof StorageError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
