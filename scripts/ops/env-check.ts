/**
 * Print the configuration report for the current environment (names and
 * problems only, never values). Exit 1 when there is any error.
 *   npm run env:check              (uses the shell environment)
 *   APP_ENV=production npm run env:check
 */
import { configReport } from "../../src/lib/env";

const { env, issues } = configReport();
console.log(`environment: ${env}`);
if (!issues.length) console.log("no issues");
for (const i of issues) console.log(`${i.level === "error" ? "ERROR  " : "warning"} ${i.name}: ${i.message}`);
process.exit(issues.some((i) => i.level === "error") ? 1 : 0);
