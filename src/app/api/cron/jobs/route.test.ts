import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { NextRequest } from "next/server";
import { GET } from "./route";

const saved = process.env.CRON_SECRET;
after(() => {
  process.env.CRON_SECRET = saved;
});
const call = (auth?: string) => GET(new NextRequest("http://localhost/api/cron/jobs", { headers: auth ? { authorization: auth } : {} }));

describe("the scheduled job runner (JOB-01)", () => {
  it("refuses every call when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    assert.equal((await call("Bearer anything")).status, 503);
  });
  it("refuses a wrong or missing bearer token", async () => {
    process.env.CRON_SECRET = "a-long-cron-secret-value";
    assert.equal((await call()).status, 401);
    assert.equal((await call("Bearer wrong")).status, 401);
  });
  it("runs the queue with the right token", async () => {
    process.env.CRON_SECRET = "a-long-cron-secret-value";
    const res = await call("Bearer a-long-cron-secret-value");
    assert.equal(res.status, 200);
    const body = (await res.json()) as { ran: number };
    assert.equal(typeof body.ran, "number");
  });
});
