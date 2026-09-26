/**
 * Backup and restore drill (INF-08).
 *
 * Proves that a logical backup of this schema can be restored into an empty
 * database and reconciled exactly. It refuses any database that is not on this
 * machine. Steps:
 *   1. read every table of SOURCE (DATABASE_URL) into a JSON backup file;
 *   2. create a scratch database on the same server and run every migration;
 *   3. restore the backup parents-first, self-references in a second pass;
 *   4. reconcile per table: row count and a digest of the sorted ids;
 *   5. drop the scratch database and write the evidence report.
 *
 *   DATABASE_URL=postgresql://...local... npx tsx scripts/db/backup-restore-drill.ts --report docs/implementation/evidence-restore-drill.json
 *
 * Production backups are the managed provider's point-in-time recovery (see
 * TECHNICAL_HANDOFF.md); this drill is the restore procedure's rehearsal.
 */
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";

const SOURCE = process.env.DATABASE_URL ?? "";
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(SOURCE)) {
  console.error("Refusing: the drill runs only against a database on this machine.");
  process.exit(1);
}
const args = process.argv.slice(2);
const reportPath = args.includes("--report") ? args[args.indexOf("--report") + 1] : null;
const scratchName = `restore_drill_${Date.now()}`;
const scratchUrl = SOURCE.replace(/\/([^/?]+)(\?|$)/, `/${scratchName}$2`);

type Model = (typeof Prisma.dmmf.datamodel.models)[number];
const models = Prisma.dmmf.datamodel.models;
const delegate = (n: string) => n.charAt(0).toLowerCase() + n.slice(1);
const digest = (ids: unknown[]) => createHash("sha256").update(ids.map(String).sort().join("\n")).digest("hex").slice(0, 16);

function order() {
  const byName = new Map(models.map((m) => [m.name, m]));
  const deps = new Map<string, Set<string>>();
  const selfRefs = new Map<string, string[]>();
  for (const m of models) {
    const d = new Set<string>();
    for (const f of m.fields) {
      if (f.kind !== "object" || !f.relationFromFields?.length) continue;
      if (f.type === m.name) selfRefs.set(m.name, [...(selfRefs.get(m.name) ?? []), ...f.relationFromFields]);
      else d.add(f.type);
    }
    deps.set(m.name, d);
  }
  const out: Model[] = [];
  const done = new Set<string>();
  const visit = (n: string) => {
    if (done.has(n)) return;
    done.add(n);
    for (const d of deps.get(n) ?? []) visit(d);
    out.push(byName.get(n)!);
  };
  for (const m of models) visit(m.name);
  return { seq: out, selfRefs };
}

type Table = Record<string, { findMany(a?: object): Promise<Record<string, unknown>[]>; createMany(a: object): Promise<unknown>; update(a: object): Promise<unknown> }>;

async function main() {
  const src = new PrismaClient({ datasourceUrl: SOURCE });
  const { seq, selfRefs } = order();
  const started = Date.now();

  // 1. Backup
  const backup: Record<string, Record<string, unknown>[]> = {};
  for (const m of seq) backup[m.name] = await (src as unknown as Table)[delegate(m.name)].findMany();
  const seqRow = await src.$queryRaw<{ last_value: bigint }[]>`SELECT last_value FROM invoice_number_seq`.catch(() => [{ last_value: 1n }]);
  const dir = path.join("scripts", "db", ".backups");
  mkdirSync(dir, { recursive: true });
  const backupFile = path.join(dir, `${scratchName}.json`);
  writeFileSync(backupFile, JSON.stringify(backup, (_k, v) => (typeof v === "bigint" ? v.toString() : v)));

  // 2. Scratch database with every migration applied
  await src.$executeRawUnsafe(`CREATE DATABASE "${scratchName}"`);
  const report: Record<string, unknown>[] = [];
  let failed = false;
  try {
    execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: scratchUrl, DIRECT_URL: scratchUrl }, stdio: "pipe" });
    const dst = new PrismaClient({ datasourceUrl: scratchUrl });

    // Migrations insert reference rows (the standard offer); the backup carries
    // the authoritative copy, so the scratch tables start empty.
    for (const m of [...seq].reverse()) await (dst as unknown as Record<string, { deleteMany(): Promise<unknown> }>)[delegate(m.name)].deleteMany();

    // 3. Restore
    for (const m of seq) {
      const cols = m.fields.filter((f) => f.kind === "scalar" || f.kind === "enum").map((f) => f.name);
      const self = selfRefs.get(m.name) ?? [];
      const rows = backup[m.name];
      for (let i = 0; i < rows.length; i += 500) {
        await (dst as unknown as Table)[delegate(m.name)].createMany({ data: rows.slice(i, i + 500).map((r) => Object.fromEntries(cols.map((c) => [c, self.includes(c) ? null : r[c]]))) });
      }
      const id = m.fields.find((f) => f.isId)?.name;
      if (self.length && id) for (const r of rows) {
        const patch = Object.fromEntries(self.filter((c) => r[c] != null).map((c) => [c, r[c]]));
        if (Object.keys(patch).length) await (dst as unknown as Table)[delegate(m.name)].update({ where: { [id]: r[id] }, data: patch });
      }
    }
    await dst.$executeRawUnsafe(`SELECT setval('invoice_number_seq', ${Number(seqRow[0]?.last_value ?? 1)})`);

    // 4. Reconcile
    for (const m of seq) {
      const id = m.fields.find((f) => f.isId)?.name;
      const back = await (dst as unknown as Table)[delegate(m.name)].findMany();
      const ok = back.length === backup[m.name].length && (!id || digest(back.map((r) => r[id])) === digest(backup[m.name].map((r) => r[id])));
      if (!ok) failed = true;
      report.push({ table: m.name, rows: backup[m.name].length, restored: back.length, ok });
    }
    await dst.$disconnect();
  } finally {
    // 5. Clean up the scratch database
    await src.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${scratchName}" WITH (FORCE)`);
    await src.$disconnect();
  }
  const total = report.reduce((a, r) => a + (r.rows as number), 0);
  const summary = { at: new Date().toISOString(), tables: report.length, rows: total, failed, seconds: Math.round((Date.now() - started) / 1000), backupFile, invoiceSequence: Number(seqRow[0]?.last_value ?? 1), details: report };
  console.log(`${failed ? "RESTORE DRILL FAILED" : "restore drill passed"}: ${report.length} tables, ${total} rows, ${summary.seconds}s`);
  if (reportPath) writeFileSync(reportPath, JSON.stringify(summary, null, 2));
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
