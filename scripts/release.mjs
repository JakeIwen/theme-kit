// Publishes a theme-kit release and rolls it out: whole suite, version bump
// commit and tag, push, then fanout to every consumer app.
//
// Usage: npm run release -- <patch|minor|major> [--no-fanout]
// A major release never reaches apps on its own: their ^N ranges exclude it.
import { execFileSync, execSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const [bump, ...rest] = process.argv.slice(2);
if (!["patch", "minor", "major"].includes(bump)) {
  console.error("Usage: npm run release -- <patch|minor|major> [--no-fanout]");
  process.exit(2);
}
const git = (...args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
const run = command => execSync(command, { cwd: root, stdio: "inherit" });

if (git("status", "--porcelain")) { console.error("Commit or stash changes before releasing."); process.exit(1); }
if (git("branch", "--show-current") !== "main") { console.error("Release from main."); process.exit(1); }
run("npm run check");
run(`npm version ${bump} -m "Release %s"`);
run("git push --follow-tags");
if (!rest.includes("--no-fanout")) run("npm run fanout");
