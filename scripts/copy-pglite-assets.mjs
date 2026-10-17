import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const sourceDir = join(root, "node_modules/@electric-sql/pglite/dist");
const files = ["pglite.data", "pglite.wasm", "initdb.wasm"];
const out = join(root, ".vercel/output/functions");

function walk(dir, found) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === "_libs") found.push(path);
      walk(path, found);
    }
  }
}

const targets = [];
walk(out, targets);
if (!targets.length) {
  console.error("copy-pglite-assets: no _libs folder under .vercel/output/functions");
  process.exit(1);
}
for (const target of targets) {
  mkdirSync(target, { recursive: true });
  for (const file of files) {
    cpSync(join(sourceDir, file), join(target, file));
  }
  console.log("copied PGLite assets into", target);
}
