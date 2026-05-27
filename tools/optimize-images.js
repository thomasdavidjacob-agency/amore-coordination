// Optimize localized images: cap dimensions + re-encode.
// Photographic PNGs (hero, covers) -> JPEG (.png deleted). Gallery JPEGs resized in place.
// Run: node tools/optimize-images.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ASSETS = path.join(__dirname, "..", "src", "assets");

async function toJpeg(file, maxW, quality) {
  const out = file.replace(/\.png$/i, ".jpg");
  const tmp = out + ".tmp";
  await sharp(file).resize({ width: maxW, withoutEnlargement: true }).jpeg({ quality, mozjpeg: true }).toFile(tmp);
  fs.renameSync(tmp, out);
  if (out !== file) fs.unlinkSync(file); // remove the old .png
  return out;
}

async function jpegInPlace(file, maxW, quality) {
  const tmp = file + ".tmp";
  await sharp(file).resize({ width: maxW, withoutEnlargement: true }).jpeg({ quality, mozjpeg: true }).toFile(tmp);
  fs.renameSync(tmp, file);
}

async function pngInPlace(file, maxW) {
  const tmp = file + ".tmp";
  await sharp(file).resize({ width: maxW, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true }).toFile(tmp);
  fs.renameSync(tmp, file);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

async function run() {
  const before = walk(ASSETS).reduce((n, f) => n + fs.statSync(f).size, 0);

  // Hero: large display, convert to JPEG @ <=2000px
  for (const f of fs.readdirSync(path.join(ASSETS, "images/hero")))
    if (/\.png$/i.test(f)) await toJpeg(path.join(ASSETS, "images/hero", f), 2000, 82);

  // Covers: shown small, convert to JPEG @ <=1000px
  for (const f of fs.readdirSync(path.join(ASSETS, "images/covers")))
    if (/\.png$/i.test(f)) await toJpeg(path.join(ASSETS, "images/covers", f), 1000, 82);

  // Portrait
  const portrait = path.join(ASSETS, "images/amy-elizabeth-ha-wedding-planner.jpg");
  if (fs.existsSync(portrait)) await jpegInPlace(portrait, 1200, 82);

  // Awards graphic stays PNG (text/badges), just cap size
  const awards = path.join(ASSETS, "images/amore-coordination-awards-2024.png");
  if (fs.existsSync(awards)) await pngInPlace(awards, 1000);

  // Gallery photos: cap at 1600px, re-encode JPEG
  const gallery = walk(path.join(ASSETS, "weddings")).filter((f) => /\.jpe?g$/i.test(f));
  let done = 0;
  for (const f of gallery) {
    await jpegInPlace(f, 1600, 80);
    if (++done % 150 === 0) console.log(`  gallery …${done}/${gallery.length}`);
  }

  const after = walk(ASSETS).reduce((n, f) => n + fs.statSync(f).size, 0);
  const mb = (b) => (b / 1048576).toFixed(1) + "MB";
  console.log(`\nDone. ${mb(before)} -> ${mb(after)} (saved ${mb(before - after)})`);
}
run().catch((e) => { console.error(e); process.exit(1); });
