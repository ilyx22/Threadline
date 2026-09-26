/**
 * Copy the pre-PostgreSQL SQLite database into an EMPTY PostgreSQL database,
 * then reconcile. It never overwrites: if any target table has rows it stops.
 *
 *   LEGACY_SQLITE_URL="file:../dev.db" DATABASE_URL=postgresql://... \
 *     npx tsx scripts/db/sqlite-to-postgres.ts [--report path.json] [--dry-run]
 *
 * Order: models are copied parents-first (topological order over required
 * foreign keys). Self-references are copied with the self-reference nulled,
 * then restored in a second pass, so row order never violates a constraint.
 * Reconciliation per table: row count, sorted-ID digest, and a deep compare of
 * the first and last rows by ID. Exit code 1 on any mismatch.
 *
 * The legacy client is generated from prisma/legacy-sqlite/schema.prisma
 * (`npx prisma generate --schema prisma/legacy-sqlite/schema.prisma`).
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { writeFileSync } from "node:fs";

// .env.local wins over .env (the generated client loads .env on import, so read .env.local explicitly)
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
const local = existsSync(".env.local") ? (parseEnv(readFileSync(".env.local", "utf8")) as Record<string, string>) : {};
const TARGET_URL = process.env.TARGET_DATABASE_URL || local.DATABASE_URL || process.env.DATABASE_URL;
if (local.LEGACY_SQLITE_URL && !process.env.LEGACY_SQLITE_URL) process.env.LEGACY_SQLITE_URL = local.LEGACY_SQLITE_URL;
import { Prisma, PrismaClient } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient: LegacyClient } = require("../../node_modules/.prisma/legacy-sqlite-client") as { PrismaClient: new () => Record<string, unknown> & { $disconnect(): Promise<void> } };

type Model = (typeof Prisma.dmmf.datamodel.models)[number];
type Row = Record<string, unknown>;

const args = process.argv.slice(2);
const reportPath = args.includes("--report") ? args[args.indexOf("--report") + 1] : null;
const dryRun = args.includes("--dry-run");
const BATCH = 500;

const models = Prisma.dmmf.datamodel.models;
const delegate = (name: string) => name.charAt(0).toLowerCase() + name.slice(1);

function order(): { order: Model[]; selfRefs: Map<string, string[]> } {
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
  const temp = new Set<string>();
  const visit = (n: string) => {
    if (done.has(n)) return;
    if (temp.has(n)) throw new Error(`foreign-key cycle through ${n}: needs a staged copy`);
    temp.add(n);
    for (const d of deps.get(n) ?? []) visit(d);
    temp.delete(n);
    done.add(n);
    out.push(byName.get(n)!);
  };
  for (const m of models) visit(m.name);
  return { order: out, selfRefs };
}

const idField = (m: Model) => m.fields.find((f) => f.isId)?.name ?? null;
const scalarNames = (m: Model) => m.fields.filter((f) => f.kind === "scalar" || f.kind === "enum").map((f) => f.name);

function digest(ids: unknown[]) {
  const h = createHash("sha256");
  for (const id of ids.map(String).sort()) h.update(id + "\n");
  return h.digest("hex").slice(0, 16);
}
function norm(v: unknown): unknown {
  if (v instanceof Date) return v.toISOString();
  if (v && typeof v === "object") return JSON.stringify(v);
  return v;
}
function same(a: Row, b: Row, cols: string[]) {
  return cols.every((c) => norm(a[c]) === norm(b[c]));
}

async function main() {
  const legacy = new LegacyClient();
  if (!TARGET_URL?.startsWith("postgres")) throw new Error("target must be a PostgreSQL URL (TARGET_DATABASE_URL or DATABASE_URL in .env.local)");
  const pg = new PrismaClient({ datasourceUrl: TARGET_URL });
  const { order: seq, selfRefs } = order();
  const report: Record<string, unknown>[] = [];
  let failed = false;

  // never overwrite: every target table must be empty
  for (const m of seq) {
    const n = await (pg as unknown as Record<string, { count(): Promise<number> }>)[delegate(m.name)].count();
    if (n > 0) throw new Error(`target table ${m.name} already has ${n} rows; this script never overwrites. Use an empty database.`);
  }

  for (const m of seq) {
    const src = (legacy as unknown as Record<string, { findMany(a: object): Promise<Row[]> }>)[delegate(m.name)];
    const dst = (pg as unknown as Record<string, { createMany(a: object): Promise<unknown>; update(a: object): Promise<unknown>; findMany(a: object): Promise<Row[]>; count(): Promise<number> }>)[delegate(m.name)];
    const cols = scalarNames(m);
    const id = idField(m);
    const self = selfRefs.get(m.name) ?? [];
    const rows: Row[] = await src.findMany({});
    if (!dryRun) {
      for (let i = 0; i < rows.length; i += BATCH) {
        const chunk = rows.slice(i, i + BATCH).map((r) => {
          const o: Row = {};
          for (const c of cols) o[c] = self.includes(c) ? null : r[c];
          return o;
        });
        await dst.createMany({ data: chunk });
      }
      if (self.length && id) {
        for (const r of rows) {
          const patch: Row = {};
          for (const c of self) if (r[c] != null) patch[c] = r[c];
          if (Object.keys(patch).length) await dst.update({ where: { [id]: r[id] }, data: patch });
        }
      }
    }
    const target: Row[] = dryRun ? rows : await dst.findMany({});
    const srcIds = id ? rows.map((r) => r[id]) : [];
    const dstIds = id ? target.map((r) => r[id]) : [];
    const countOk = rows.length === target.length;
    const idsOk = !id || digest(srcIds) === digest(dstIds);
    let sampleOk = true;
    if (id && rows.length) {
      const sorted = [...rows].sort((a, b) => String(a[id]).localeCompare(String(b[id])));
      for (const s of [sorted[0], sorted[sorted.length - 1]]) {
        const t = target.find((r) => String(r[id]) === String(s[id]));
        if (!t || !same(s, t, cols)) sampleOk = false;
      }
    }
    const ok = countOk && idsOk && sampleOk;
    if (!ok) failed = true;
    report.push({ table: m.name, source: rows.length, target: target.length, idDigest: digest(srcIds), countOk, idsOk, sampleOk });
    console.log(`${ok ? "ok  " : "FAIL"} ${m.name.padEnd(28)} ${String(rows.length).padStart(6)} -> ${String(target.length).padStart(6)}`);
  }

  const total = report.reduce((a, r) => a + (r.source as number), 0);
  console.log(`${failed ? "RECONCILIATION FAILED" : "reconciled"}: ${report.length} tables, ${total} rows${dryRun ? " (dry run)" : ""}`);
  if (reportPath) writeFileSync(reportPath, JSON.stringify({ at: new Date().toISOString(), dryRun, tables: report, total, failed }, null, 2));
  await legacy.$disconnect();
  await pg.$disconnect();
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(String(e?.message ?? e));
  process.exit(1);
});
