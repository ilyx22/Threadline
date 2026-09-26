/**
 * Attio REST v2 client (COM-04), for Threadline's own CRM.
 *
 * Contract (docs.attio.com, checked 26 September 2026):
 *   PUT   /v2/objects/{object}/records?matching_attribute={slug}   assert (upsert) on a unique attribute
 *   POST  /v2/objects/{object}/records                              create
 *   PATCH /v2/objects/{object}/records/{record_id}                  update
 *   body  { data: { values: { <attribute slug>: <value or values> } } }
 *   reply { data: { id: { record_id }, web_url, values } }
 *   auth  Authorization: Bearer <access token>
 * Companies are matched on `domains`, people on `email_addresses`. Deals have
 * no unique attribute, so a deal is created once and then updated by the id
 * recorded in CrmLink. Deal stage names are workspace configuration; the
 * defaults are Attio's standard pipeline and ATTIO_STAGE_MAP overrides them.
 */
export type AttioResult = { recordId: string; webUrl: string | null };

export class AttioError extends Error {
  /** retry: transient (network, 429, 5xx). review: the request itself is wrong and needs a person. */
  constructor(message: string, readonly kind: "retry" | "review", readonly status?: number) {
    super(message);
    this.name = "AttioError";
  }
}

const BASE = "https://api.attio.com/v2";
const DEFAULT_STAGES: Record<string, string> = { lead: "Lead", in_progress: "In Progress", won: "Won 🎉", lost: "Lost" };

export function stageName(stage: string, env: Record<string, string | undefined> = process.env): string {
  try {
    const custom = JSON.parse(env.ATTIO_STAGE_MAP ?? "{}") as Record<string, string>;
    return custom[stage] ?? DEFAULT_STAGES[stage] ?? stage;
  } catch {
    return DEFAULT_STAGES[stage] ?? stage;
  }
}

export class AttioClient {
  constructor(private token: string, private fetchImpl: typeof fetch = fetch) {}

  private async call(method: string, path: string, values: Record<string, unknown>): Promise<AttioResult> {
    let res: Response;
    try {
      res = await this.fetchImpl(`${BASE}${path}`, {
        method,
        headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
        body: JSON.stringify({ data: { values } }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (e) {
      throw new AttioError(`Attio unreachable: ${e instanceof Error ? e.message : String(e)}`, "retry");
    }
    if (res.status === 429 || res.status >= 500) throw new AttioError(`Attio ${res.status}`, "retry", res.status);
    const body = (await res.json().catch(() => null)) as { data?: { id?: { record_id?: string }; web_url?: string }; message?: string } | null;
    if (!res.ok) throw new AttioError(`Attio refused the request (${res.status}): ${body?.message ?? "no detail"}`, "review", res.status);
    const recordId = body?.data?.id?.record_id;
    if (!recordId) throw new AttioError("Attio replied without a record id.", "review", res.status);
    return { recordId, webUrl: body?.data?.web_url ?? null };
  }

  upsertCompany(input: { name: string; domain: string | null }) {
    if (!input.domain) return this.call("POST", "/objects/companies/records", { name: input.name });
    return this.call("PUT", "/objects/companies/records?matching_attribute=domains", { name: input.name, domains: [input.domain] });
  }

  upsertPerson(input: { email: string; name: string; companyRecordId?: string | null }) {
    const [first, ...rest] = input.name.trim().split(/\s+/);
    const values: Record<string, unknown> = {
      email_addresses: [input.email],
      name: [{ first_name: first ?? "", last_name: rest.join(" "), full_name: input.name.trim() }],
    };
    if (input.companyRecordId) values.company = [{ target_object: "companies", target_record_id: input.companyRecordId }];
    return this.call("PUT", "/objects/people/records?matching_attribute=email_addresses", values);
  }

  dealValues(input: { name: string; stage: string; valueMinor: number | null; currency: string; companyRecordId?: string | null; personRecordId?: string | null }) {
    const values: Record<string, unknown> = { name: input.name, stage: stageName(input.stage) };
    if (input.valueMinor !== null) values.value = [{ currency_value: input.valueMinor / 100, currency_code: input.currency }];
    if (input.companyRecordId) values.associated_company = [{ target_object: "companies", target_record_id: input.companyRecordId }];
    if (input.personRecordId) values.associated_people = [{ target_object: "people", target_record_id: input.personRecordId }];
    return values;
  }

  createDeal(values: Record<string, unknown>) {
    return this.call("POST", "/objects/deals/records", values);
  }

  updateDeal(recordId: string, values: Record<string, unknown>) {
    return this.call("PATCH", `/objects/deals/records/${encodeURIComponent(recordId)}`, values);
  }
}

/** Normalise a website into the bare domain Attio matches on. */
export function domainOf(website: string | null | undefined): string | null {
  if (!website) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
    return u.hostname.replace(/^www\./, "").toLowerCase() || null;
  } catch {
    return null;
  }
}
