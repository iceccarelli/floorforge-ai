/**
 * Module resolution for the test runner.
 *
 * The source is TypeScript with a `@/` path alias, which Node understands
 * neither of. Node 22 strips types natively, so the only missing piece is the
 * alias and the extensionless relative imports TypeScript allows.
 *
 * This is twenty lines instead of a test framework. The alternative was adding
 * vitest or jest plus a transform pipeline — a large dependency tree, a second
 * config format and a second module resolver, to run tests against a codebase
 * whose whole build is one `next build`. `node --test` is already installed.
 */

import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const CANDIDATES = (base) => [
  base,
  `${base}.ts`,
  `${base}.tsx`,
  path.join(base, "index.ts"),
];

function firstExisting(base) {
  for (const candidate of CANDIDATES(base)) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const hit = firstExisting(path.join(ROOT, specifier.slice(2)));
    if (hit) return next(pathToFileURL(hit).href, context);
  }

  // Extensionless relative imports: `./types` -> `./types.ts`
  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    const hit = firstExisting(path.resolve(parentDir, specifier));
    if (hit) return next(pathToFileURL(hit).href, context);
  }

  return next(specifier, context);
}
