/**
 * Create the first real staff account on an empty production database.
 *
 * The demo seed refuses to run in production (it would create fictional
 * clients), so without this there is no way to sign in to a fresh deployment.
 *
 * Usage (from a machine with the production DIRECT_URL, never committed):
 *   DATABASE_URL=<direct url> DIRECT_URL=<direct url> \
 *   OWNER_EMAIL=you@threadlinehq.com OWNER_NAME="Your Name" \
 *   npx tsx scripts/ops/create-owner.ts
 * The password is asked for on the terminal and never printed, logged or stored
 * anywhere except as a scrypt hash.
 *
 * Safe to re-run: it creates the internal "threadline" organisation only if it
 * is missing, and refuses to touch an existing user with the same email. It never
 * deletes or overwrites anything.
 */
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../../src/lib/auth/password";

/** One reader for every prompt: a second reader on the same stdin loses piped input. */
function hiddenPrompter() {
  const muted = new Writable({ write: (_chunk, _enc, cb) => cb() });
  const rl = createInterface({ input: process.stdin, output: muted, terminal: process.stdin.isTTY ?? false });
  const lines: string[] = [];
  const waiting: ((line: string) => void)[] = [];
  rl.on("line", (line) => {
    const next = waiting.shift();
    if (next) next(line);
    else lines.push(line);
  });
  return {
    ask(question: string): Promise<string> {
      process.stdout.write(question);
      const ready = lines.shift();
      const answer = ready !== undefined ? Promise.resolve(ready) : new Promise<string>((resolve) => waiting.push(resolve));
      return answer.then((a) => {
        process.stdout.write("\n");
        return a;
      });
    },
    close: () => rl.close(),
  };
}

async function main() {
  const email = (process.env.OWNER_EMAIL ?? "").trim().toLowerCase();
  const name = (process.env.OWNER_NAME ?? "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Set OWNER_EMAIL to a valid address.");
  if (name.length < 2) throw new Error("Set OWNER_NAME.");

  // Git Bash (mintty) is not a Windows console: Node cannot read keystrokes
  // from it, so the prompt would wait forever and typed text may be echoed.
  if (!process.stdin.isTTY && process.env.MSYSTEM) {
    throw new Error("Git Bash cannot pass a hidden password to this script. Run it from Windows PowerShell instead (see docs/launch-pack/sprint/ACTIVATION_RUNBOOK.md §1). Nothing was changed.");
  }

  const prisma = new PrismaClient();
  try {
    if (await prisma.user.findUnique({ where: { email } })) {
      throw new Error(`A user with ${email} already exists. Nothing was changed.`);
    }
    const prompt = hiddenPrompter();
    const password = await prompt.ask("Password (min 12 characters, not shown): ");
    const confirm = await prompt.ask("Repeat password: ");
    prompt.close();
    if (password.length < 12) throw new Error("Use at least 12 characters. Nothing was changed.");
    if (confirm !== password) throw new Error("Passwords do not match. Nothing was changed.");

    const passwordHash = await hashPassword(password);
    const result = await prisma.$transaction(async (tx) => {
      const org =
        (await tx.organization.findFirst({ where: { kind: "internal" } })) ??
        (await tx.organization.create({
          data: { slug: "threadline", name: "Threadline", kind: "internal", status: "active", currency: "GBP" },
        }));
      const user = await tx.user.create({ data: { email, name, passwordHash, isSuperAdmin: true } });
      await tx.membership.create({ data: { userId: user.id, orgId: org.id, role: "super_admin", isPrimary: true } });
      return { org: org.slug, userId: user.id };
    });
    console.log(`Created super admin ${email} in internal workspace "${result.org}".`);
    console.log("Next: sign in, open Account security and enrol two-factor (required for staff in production).");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
