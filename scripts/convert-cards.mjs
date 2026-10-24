// Convert designer PNGs (1.png … N.png, 1500x2100) into small webp cards.
// usage: node scripts/convert-cards.mjs <src-dir>
import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";

const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/convert-cards.mjs <src-dir>");
  process.exit(1);
}
const out = path.resolve("public/cards");
await mkdir(out, { recursive: true });

for (const file of await readdir(src)) {
  const m = file.match(/^(\d+)\.png$/i);
  if (!m) continue;
  const id = m[1].padStart(3, "0");
  const dest = path.join(out, `${id}.webp`);
  await sharp(path.join(src, file)).resize(750, 1050).webp({ quality: 82 }).toFile(dest);
  console.log(file, "→", dest);
}
