import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { zipSync, unzipSync } from "fflate";
import { posix } from "node:path";
const files = [
  "manifest.json",
  "background.js",
  "LICENSE",
  "README.md",
  "PRIVACY.md",
  "THIRD_PARTY_NOTICES.md",
  "SECURITY.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
];
async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const path = dir + "/" + e.name;
    if (e.isDirectory()) await walk(path);
    else files.push(path);
  }
}
for (const dir of [
  "content",
  "popup",
  "reader",
  "shared",
  "vendor",
  "fonts",
  "icons",
  "docs",
])
  await walk(dir);
const hashes = JSON.parse(await readFile("vendor/checksums.json", "utf8"));
for (const [path, expected] of Object.entries(hashes))
  if (
    createHash("sha256")
      .update(await readFile(path))
      .digest("hex") !== expected
  )
    throw Error("Vendored file changed: " + path);
const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
if (manifest.host_permissions || manifest.content_scripts)
  throw Error("Unexpected persistent page access");
const archive = {};
for (const path of files.sort())
  archive["bookit/" + path] = [
    new Uint8Array(await readFile(path)),
    { mtime: new Date(2026, 0, 1, 0, 0, 0) },
  ];
const filename = "bookit-" + manifest.version + ".zip";
const bytes = zipSync(archive, { level: 9 });
const unpacked = unzipSync(bytes);
for (const path of files.filter((p) => p.endsWith(".html"))) {
  const html = Buffer.from(unpacked["bookit/" + path]).toString("utf8");
  for (const match of html.matchAll(/(?:src|href)="([^"?#]+)[^"]*"/g)) {
    if (/^[a-z]+:/i.test(match[1])) continue;
    const target = posix.normalize(
      posix.join("bookit", posix.dirname(path), match[1]),
    );
    if (!unpacked[target]) throw Error("Missing package resource: " + target);
  }
}
await mkdir("artifacts", { recursive: true });
await writeFile("artifacts/" + filename, bytes);
await writeFile(
  "artifacts/SHA256SUMS.txt",
  createHash("sha256").update(bytes).digest("hex") + "  " + filename + "\n",
);
console.log(
  "Packaged " +
    files.length +
    " runtime files: artifacts/" +
    filename +
    " (" +
    bytes.length +
    " bytes)",
);
