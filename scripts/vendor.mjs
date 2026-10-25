import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../", import.meta.url);
const pairs = [
  ["node_modules/dompurify/dist/purify.min.js", "vendor/purify.min.js"],
  ["node_modules/dompurify/LICENSE", "vendor/DOMPurify.LICENSE"],
  ["node_modules/@mozilla/readability/Readability.js", "vendor/Readability.js"],
  [
    "node_modules/@mozilla/readability/LICENSE.md",
    "vendor/Readability.LICENSE",
  ],
  [
    "node_modules/@fontsource-variable/vazirmatn/files/vazirmatn-arabic-wght-normal.woff2",
    "fonts/vazirmatn-arabic.woff2",
  ],
  [
    "node_modules/@fontsource-variable/vazirmatn/files/vazirmatn-latin-wght-normal.woff2",
    "fonts/vazirmatn-latin.woff2",
  ],
  ["node_modules/@fontsource-variable/vazirmatn/LICENSE", "fonts/OFL.txt"],
  ["node_modules/lucide-static/LICENSE", "vendor/Lucide.LICENSE"],
];
for (const [from, to] of pairs) {
  await mkdir(new URL(to.split("/").slice(0, -1).join("/") + "/", root), {
    recursive: true,
  });
  await copyFile(new URL(from, root), new URL(to, root));
}
const names = [
  "book-open",
  "bookmark",
  "library",
  "search",
  "sun",
  "moon",
  "maximize-2",
  "minimize-2",
  "arrow-up-right",
  "download",
  "upload",
  "shield-check",
  "highlighter",
  "trash-2",
  "x",
  "list",
  "rotate-cw",
  "columns-2",
  "arrow-left",
  "arrow-right",
  "clock-3",
  "file-text",
  "plus",
  "type",
  "settings-2",
  "globe",
  "check",
  "notebook-pen",
];
const icons = {};
for (const name of names)
  icons[name] = (
    await readFile(
      new URL("node_modules/lucide-static/icons/" + name + ".svg", root),
      "utf8",
    )
  )
    .replace(/<\?xml[^>]*>/g, "")
    .replace("<svg ", '<svg aria-hidden="true" focusable="false" ');
await writeFile(
  new URL("shared/icons.js", root),
  "/* Generated from lucide-static. See vendor/Lucide.LICENSE. */\nglobalThis.BookitIcons = Object.freeze(" +
    JSON.stringify(icons) +
    ");\n",
);
const hashes = {};
for (const [, to] of pairs)
  hashes[to] = createHash("sha256")
    .update(await readFile(new URL(to, root)))
    .digest("hex");
hashes["shared/icons.js"] = createHash("sha256")
  .update(await readFile(new URL("shared/icons.js", root)))
  .digest("hex");
await writeFile(
  new URL("vendor/checksums.json", root),
  JSON.stringify(hashes, null, 2) + "\n",
);
console.log("Vendored offline libraries, icons and OFL fonts.");
