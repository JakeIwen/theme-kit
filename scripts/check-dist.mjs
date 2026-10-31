// Fails when the committed dist/ differs from a fresh build of src/. Apps
// install theme-kit from git without building it, so dist/ is what ships.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const fresh = mkdtempSync(join(tmpdir(), "theme-kit-dist-"));
const files = dir => readdirSync(dir, { withFileTypes: true, recursive: true })
  .filter(entry => entry.isFile())
  .map(entry => relative(dir, join(entry.parentPath, entry.name)))
  .sort();

try {
  execFileSync(join(root, "node_modules/.bin/tsc"), ["-p", join(root, "tsconfig.json"), "--outDir", fresh], { stdio: "inherit" });
  const built = files(fresh);
  const committed = files(join(root, "dist"));
  const stale = [...new Set([...built, ...committed])].filter(file =>
    !built.includes(file) || !committed.includes(file) ||
    readFileSync(join(fresh, file), "utf8") !== readFileSync(join(root, "dist", file), "utf8"));
  if (stale.length) {
    console.error(`dist/ is stale; run npm run build and commit it:\n  ${stale.join("\n  ")}`);
    process.exit(1);
  }
  console.log("dist/ matches src/");
} finally {
  rmSync(fresh, { recursive: true, force: true });
}
