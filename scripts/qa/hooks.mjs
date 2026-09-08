import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SHIMS = {
  "next/headers": pathToFileURL(join(here, "shims", "next-headers.mjs")).href,
  "next/navigation": pathToFileURL(join(here, "shims", "next-navigation.mjs")).href,
  "next/cache": pathToFileURL(join(here, "shims", "next-cache.mjs")).href,
};

export async function resolve(specifier, context, nextResolve) {
  const shim = SHIMS[specifier];
  if (shim) return { url: shim, shortCircuit: true, format: "module" };
  return nextResolve(specifier, context);
}
