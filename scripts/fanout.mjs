// Moves every consumer app to the newest compatible theme-kit release:
// update the dependency, run the app's whole suite, commit and push only the
// dependency files, then deploy. Stops at the first app that fails.
//
// Usage: npm run fanout [-- [--no-deploy] [--dry-run] [name ...]]
import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const kitRoot = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const flags = new Set(args.filter(arg => arg.startsWith("--")));
const names = args.filter(arg => !arg.startsWith("--"));
const { consumers } = JSON.parse(readFileSync(join(kitRoot, "consumers.json"), "utf8"));
const { version: kitVersion } = JSON.parse(readFileSync(join(kitRoot, "package.json"), "utf8"));

const git = (repo, ...gitArgs) => execFileSync("git", ["-C", repo, ...gitArgs], { encoding: "utf8" }).trim();
const run = (command, cwd) => execSync(command, { cwd, stdio: "inherit", shell: "/bin/zsh" });

function installed(packageDir) {
  const lock = JSON.parse(readFileSync(join(packageDir, "package-lock.json"), "utf8"));
  const entry = lock.packages?.["node_modules/theme-kit"];
  return entry ? `${entry.version} (${entry.resolved})` : "not installed";
}

function update(consumer) {
  const repo = consumer.repo.replace(/^~(?=\/)/, homedir());
  const packageDir = join(repo, consumer.package);
  const files = ["package.json", "package-lock.json"].map(file => join(consumer.package, file));
  const dirty = git(repo, "status", "--porcelain");
  if (dirty) throw new Error(`${consumer.name}: ${repo} has uncommitted changes; commit or stash them first:\n${dirty}`);
  const spec = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8")).dependencies?.["theme-kit"];
  if (!spec) throw new Error(`${consumer.name}: no theme-kit dependency in ${packageDir}/package.json`);
  const before = installed(packageDir);
  console.log(`\n== ${consumer.name}: theme-kit ${before}`);
  if (flags.has("--dry-run")) return;
  // Naming the spec makes npm re-resolve its semver range against the tags.
  run(`npm install --no-audit --no-fund "theme-kit@${spec}"`, packageDir);
  const after = installed(packageDir);
  if (after === before) { console.log(`${consumer.name}: already current`); return; }
  try {
    run(consumer.check, repo);
  } catch (error) {
    git(repo, "checkout", "--", ...files);
    run("npm install --no-audit --no-fund", packageDir);
    throw new Error(`${consumer.name}: suite failed on theme-kit ${after}; left at ${before}`);
  }
  git(repo, "add", "--", ...files);
  git(repo, "commit", "-m", `Update theme-kit to ${kitVersion}`, "-m",
    `theme-kit fanout: move to the newest ${spec} release so the shared theme editor matches the other apps. The whole suite passed on ${after}.`);
  git(repo, "push");
  if (flags.has("--no-deploy")) return;
  run(consumer.deploy, repo);
}

const selected = names.length ? consumers.filter(consumer => names.includes(consumer.name)) : consumers;
const unknown = names.filter(name => !consumers.some(consumer => consumer.name === name));
if (unknown.length) { console.error(`Unknown consumer: ${unknown.join(", ")}`); process.exit(2); }
for (const consumer of selected) {
  try { update(consumer); }
  catch (error) { console.error(`\nfanout stopped: ${error.message}`); process.exit(1); }
}
console.log(`\nfanout done: ${selected.map(consumer => consumer.name).join(", ")}`);
