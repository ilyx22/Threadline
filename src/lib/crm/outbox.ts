import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { sideEffectsAllowed } from "@/lib/env";
import { enqueue } from "@/lib/jobs";
import { AttioClient, AttioError } from "./attio";

/**
 * The CRM outbox (COM-04).
 *
 * Code that changes a commercial fact (an application converted, a deal won or
 * lost, a renewal opened) writes an outbox row in its own transaction; a job
 * sends it. The CRM being down, slow or rate-limiting never loses or blocks the
 * change: transient failures retry with backoff, a request the CRM rejects is
 * parked as `needs_review` for a person, and each row is idempotent on its key.
 *
 * Sending happens only in production with ATTIO_API_KEY set. Elsewhere rows
 * stay `pending` with an explanation, so no test or preview ever writes to the
 * live CRM.
 */
export type CrmOperation =
  | { op: "upsert_company"; entityType: "application" | "prospect" | "organization"; entityId: string; name: string; domain: string | null }
  | { op: "upsert_person"; entityType: "application" | "prospect" | "membership"; entityId: string; email: string; name: string; companyEntity: { type: string; id: string } | null }
  | { op: "upsert_deal"; entityType: "application" | "engagement"; entityId: string; name: string; stage: "lead" | "in_progress" | "won" | "lost"; valueMinor: number | null; currency: string; companyEntity: { type: string; id: string } | null; personEntity: { type: string; id: string } | null };

type Db = Pick<typeof prisma, "crmOutbox">;

/** Record CRM work. Pass the transaction client to write it atomically with the change. */
export async function queueCrm(db: Db, op: CrmOperation, key: string) {
  const row = await db.crmOutbox.upsert({
    where: { idempotencyKey: key },
    create: { provider: "attio", entityType: op.entityType, entityId: op.entityId, operation: op.op, payload: JSON.stringify(op), idempotencyKey: key },
    update: {},
  });
  return row;
}

/** After the transaction commits: schedule the sender. */
export async function kickCrm(rowIds: string[]) {
  for (const id of rowIds) await enqueue("crm.sync", { outboxId: id }, { idempotencyKey: `crm.sync:${id}` });
}

const MAX_ATTEMPTS = 8;

async function linkFor(entity: { type: string; id: string } | null, remoteObject: string) {
  if (!entity) return null;
  const l = await prisma.crmLink.findUnique({ where: { provider_entityType_entityId: { provider: "attio", entityType: entity.type, entityId: entity.id } } });
  return l && l.remoteObject === remoteObject ? l.remoteId : null;
}

/**
 * Send one outbox row. Returns the resulting state. Throws only for a
 * transient failure, so the job queue applies its backoff.
 */
export async function sendOutboxRow(id: string, opts: { client?: AttioClient; env?: Record<string, string | undefined> } = {}) {
  const row = await prisma.crmOutbox.findUniqueOrThrow({ where: { id } });
  if (row.state === "sent" || row.state === "dead" || row.state === "needs_review") return row.state;
  const env = opts.env ?? process.env;
  const token = env.ATTIO_API_KEY;
  if (!opts.client && (!token || !sideEffectsAllowed(env))) {
    await prisma.crmOutbox.update({ where: { id }, data: { lastError: token ? "Held: CRM writes run only in production." : "Held: ATTIO_API_KEY is not configured." } });
    return "pending";
  }
  const client = opts.client ?? new AttioClient(token!);
  const op = JSON.parse(row.payload) as CrmOperation;
  try {
    let result: { recordId: string; webUrl: string | null };
    let remoteObject: string;
    if (op.op === "upsert_company") {
      result = await client.upsertCompany({ name: op.name, domain: op.domain });
      remoteObject = "companies";
    } else if (op.op === "upsert_person") {
      const company = await linkFor(op.companyEntity, "companies");
      result = await client.upsertPerson({ email: op.email, name: op.name, companyRecordId: company });
      remoteObject = "people";
    } else {
      const company = await linkFor(op.companyEntity, "companies");
      const person = await linkFor(op.personEntity, "people");
      if ((op.companyEntity && !company) || (op.personEntity && !person)) throw new AttioError("Waiting for the company and person to sync first.", "retry");
      const values = client.dealValues({ name: op.name, stage: op.stage, valueMinor: op.valueMinor, currency: op.currency, companyRecordId: company, personRecordId: person });
      const existing = await prisma.crmLink.findUnique({ where: { provider_entityType_entityId: { provider: "attio", entityType: op.entityType, entityId: op.entityId } } });
      result = existing ? await client.updateDeal(existing.remoteId, values) : await client.createDeal(values);
      remoteObject = "deals";
    }
    await prisma.$transaction([
      prisma.crmLink.upsert({
        where: { provider_entityType_entityId: { provider: "attio", entityType: op.entityType, entityId: op.entityId } },
        create: { provider: "attio", entityType: op.entityType, entityId: op.entityId, remoteObject, remoteId: result.recordId, remoteUrl: result.webUrl },
        update: { remoteId: result.recordId, remoteUrl: result.webUrl, lastSyncedAt: new Date() },
      }),
      prisma.crmOutbox.update({ where: { id }, data: { state: "sent", sentAt: new Date(), remoteId: result.recordId, attempts: { increment: 1 }, lastError: null } }),
    ]);
    return "sent";
  } catch (e) {
    // The CRM matched this to a record already linked to a different Threadline
    // record (e.g. two workspaces sharing a domain): a person must decide.
    const duplicateLink = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
    const err = duplicateLink
      ? new AttioError("The CRM returned a record already linked to another Threadline record. Check for duplicates in the CRM, then retry.", "review")
      : e instanceof AttioError
        ? e
        : new AttioError(e instanceof Error ? e.message : String(e), "retry");
    const attempts = row.attempts + 1;
    const state = err.kind === "review" ? "needs_review" : attempts >= MAX_ATTEMPTS ? "dead" : "failed";
    await prisma.crmOutbox.update({ where: { id }, data: { state, attempts, lastError: err.message.slice(0, 1000) } });
    if (state === "failed") throw err;
    return state;
  }
}

/** Operator view: everything not yet in the CRM, oldest first. */
export async function crmBacklog() {
  return prisma.crmOutbox.findMany({ where: { state: { not: "sent" } }, orderBy: { createdAt: "asc" }, take: 100 });
}

/** Operator action: try a parked row again (after fixing the cause). */
export async function retryOutboxRow(id: string) {
  await prisma.crmOutbox.update({ where: { id }, data: { state: "pending", attempts: 0, lastError: null } });
  await enqueue("crm.sync", { outboxId: id }, { idempotencyKey: `crm.sync:${id}:${Date.now()}` });
}
