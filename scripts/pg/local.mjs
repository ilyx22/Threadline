/**
 * A real PostgreSQL for local integration tests (embedded-postgres: the
 * official binaries via npm, no account, no service install). Data lives in
 * .pg-data/ (git-ignored). Never used by a deployment.
 *
 *   node scripts/pg/local.mjs start   # init once, start on 55432, create threadline_test
 *   node scripts/pg/local.mjs stop
 *   node scripts/pg/local.mjs url     # print the test DATABASE_URL
 */
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";

const dir = path.resolve(".pg-data");
const port = Number(process.env.PG_LOCAL_PORT || 55432);
const user = "threadline";
const password = "threadline-local-only";
const db = process.env.PG_LOCAL_DB || "threadline_test";
const url = `postgresql://${user}:${password}@127.0.0.1:${port}/${db}?schema=public`;

const pg = new EmbeddedPostgres({ databaseDir: dir, user, password, port, persistent: true, initdbFlags: ["--encoding=UTF8", "--locale=C"], onLog: () => {}, onError: (e) => console.error(String(e)) });

const cmd = process.argv[2] || "start";
if (cmd === "url") {
  console.log(url);
} else if (cmd === "start") {
  if (!existsSync(path.join(dir, "PG_VERSION"))) await pg.initialise();
  await pg.start();
  try {
    await pg.createDatabase(db);
  } catch {
    /* exists */
  }
  console.log(`postgres up on ${port}`);
  console.log(url);
  // keep the process alive so the server stays up; Ctrl+C or `stop` from another shell
  process.on("SIGINT", async () => {
    await pg.stop();
    process.exit(0);
  });
  setInterval(() => {}, 1 << 30);
} else if (cmd === "stop") {
  await pg.stop();
  console.log("stopped");
}
