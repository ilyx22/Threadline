/**
 * QA only: mint a signed-in session for a LOCAL demo account and print the
 * cookie value, for authenticated screenshots (`shoot --session=`). Refuses
 * any database that is not on this machine.
 *   DATABASE_URL=... npx tsx scripts/qa/mint-session.ts ops@threadline.com
 */
import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL ?? "";
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  console.error("Refusing: DATABASE_URL is not a local database.");
  process.exit(1);
}
const email = process.argv[2];
const prisma = new PrismaClient({ datasourceUrl: url });
(async () => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`no user ${email}`);
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({ data: { token: createHash("sha256").update(token).digest("hex"), userId: user.id, expiresAt: new Date(Date.now() + 3_600_000), mfaVerifiedAt: new Date(), userAgent: "qa-shoot" } });
  console.log(token);
  await prisma.$disconnect();
})();
