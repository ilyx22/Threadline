/**
 * Development helper: mint a session cookie for a seeded demo user.
 * Used to exercise authenticated routes from the command line during QA.
 * Not imported by the application.
 */
const { PrismaClient } = require("@prisma/client");
const crypto = require("node:crypto");

const prisma = new PrismaClient();

(async () => {
  const email = process.argv[2];
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user with email ${email}`);
    process.exit(1);
  }
  const token = crypto.randomBytes(32).toString("base64url");
  const digest = crypto.createHash("sha256").update(token).digest("hex");
  await prisma.session.create({
    data: { token: digest, userId: user.id, expiresAt: new Date(Date.now() + 86_400_000) },
  });
  console.log(token);
  await prisma.$disconnect();
})();
