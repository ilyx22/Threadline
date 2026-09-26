/**
 * SEC-01 data check: list staff roles recorded on client workspaces (which no
 * longer grant anything) and staff who lack an internal-organisation membership.
 * Read-only. DATABASE_URL must be set.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
async function main() {
  const misplaced = await prisma.membership.findMany({
    where: { role: { in: ["internal_operator", "super_admin"] }, org: { kind: { not: "internal" } } },
    select: { role: true, user: { select: { email: true } }, org: { select: { slug: true } } },
  });
  const staff = await prisma.membership.findMany({
    where: { role: { in: ["internal_operator", "super_admin"] }, org: { kind: "internal" } },
    select: { user: { select: { email: true } } },
  });
  console.log(JSON.stringify({ misplacedStaffRoles: misplaced.map((m) => `${m.user.email} ${m.role} @ ${m.org.slug}`), internalStaff: staff.map((s) => s.user.email) }, null, 2));
  await prisma.$disconnect();
}
main();
