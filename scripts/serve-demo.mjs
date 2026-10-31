// Serves the repo read-only on loopback so demo/ can load dist/ as ES modules.
// Usage: npm run demo [-- <port>]   (default: a free port)
import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };

const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const file = normalize(join(root, path.endsWith("/") ? `${path}index.html` : path));
  let ok = file.startsWith(root + "/") && !file.includes("/node_modules/");
  try { ok &&= statSync(file).isFile(); } catch { ok = false; }
  if (!ok) { res.writeHead(404).end("Not found"); return; }
  res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
  createReadStream(file).pipe(res);
});
server.listen(Number(process.argv[2] ?? 0), "127.0.0.1", () => {
  console.log(`Demo: http://127.0.0.1:${server.address().port}/demo/`);
});
