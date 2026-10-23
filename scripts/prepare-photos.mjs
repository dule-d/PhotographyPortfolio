import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "src", "assets", "porfolio");
const out = path.join(root, "public", "photos");

const folders = {
  "car exh": "Automotive",
  "Eksportirani-viktor": "Portrait",
  pobeda: "Sport",
  solun: "Travel",
  random: "Sport",
};
// Per-file category overrides (folder name / file name without extension).
const overrides = {
  "car exh/carExhib-8": "Portrait",
  "random/IMG_4419": "Travel",
  "random/IMG_9875": "Automotive",
};
const skip = new Set(["fkpobeda post-5.jpg"]); // unedited duplicate of "post-5 edited"

const sizes = [
  ["m", 360, 68],
  ["s", 720, 72],
  ["l", 1800, 78],
];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const byCategory = {};
for (const [folder, defaultCategory] of Object.entries(folders)) {
  const dir = path.join(source, folder);
  const files = fs.readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f) && !skip.has(f));
  files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  for (const file of files) {
    const name = file.replace(/\.[^.]+$/, "");
    const category = overrides[`${folder}/${name}`] ?? defaultCategory;
    const id = `${folder}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const input = await sharp(path.join(dir, file), { limitInputPixels: false }).rotate().toBuffer();
    const { dominant } = await sharp(input).resize(64).stats();
    const color = "#" + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, "0")).join("");
    let w = 0, h = 0;
    for (const [suffix, width, quality] of sizes) {
      const info = await sharp(input)
        .resize({ width, height: Math.round(width * 1.6), fit: "inside", withoutEnlargement: true })
        .webp({ quality, effort: 5 })
        .toFile(path.join(out, `${id}-${suffix}.webp`));
      if (suffix === "s") ({ width: w, height: h } = info);
    }
    (byCategory[category] ??= []).push({ id, category, color, w, h });
  }
}

// Interleave categories so any slice of the gallery is a mix.
const lists = Object.values(byCategory);
const total = lists.reduce((n, l) => n + l.length, 0);
const photos = [];
for (let i = 0; photos.length < total; i++) for (const l of lists) if (l[i]) photos.push(l[i]);

fs.mkdirSync(path.join(root, "src", "data"), { recursive: true });
fs.writeFileSync(
  path.join(root, "src", "data", "photos.json"),
  JSON.stringify({ categories: Object.keys(byCategory), photos }),
);
console.log("done", photos.length, Object.keys(byCategory).join(","));
