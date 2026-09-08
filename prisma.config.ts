import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "prisma/config";

// prisma.config.ts disables Prisma's implicit .env loading, so load it explicitly.
// Node >= 20.6 provides process.loadEnvFile.
for (const file of [".env.local", ".env"]) {
  if (fs.existsSync(file)) process.loadEnvFile(file);
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx --conditions=react-server prisma/seed.ts",
  },
});
