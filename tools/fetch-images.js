// One-time image localizer: downloads all hotlinked images from amorecoordination.com
// into src/assets, then rewrites src/_data/galleries.js to local paths.
// Run: node tools/fetch-images.js
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ASSETS = path.join(ROOT, "src", "assets");
const galleries = require("../src/_data/galleries.js");

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  Referer: "https://amorecoordination.com/",
};

const CACHE = "https://amorecoordination.com/wp-content/uploads/yootheme/cache/";
const UP = "https://amorecoordination.com/wp-content/uploads/2024/10/";

// Single, high-value images get descriptive local names.
const singles = [
  { url: CACHE + "2c/DSC07970-Edit-scaled-2c718048.jpg", path: "images/amy-elizabeth-ha-wedding-planner.jpg" },
  { url: "https://amorecoordination.com/wp-content/uploads/2024/11/Awards2024.png", path: "images/amore-coordination-awards-2024.png" },
  // hero slides
  { url: CACHE + "67/home-hero-Lisa-Bryan-677c9e91.png", path: "images/hero/home-hero-Lisa-Bryan.png" },
  { url: CACHE + "22/home-hero-Royeric-Katie-2289f596.png", path: "images/hero/home-hero-Royeric-Katie.png" },
  { url: CACHE + "f5/home-hero-Madie-Tyler-f58de3df.png", path: "images/hero/home-hero-Madie-Tyler.png" },
  { url: CACHE + "ef/home-slideshow-Jeanna-Michael-ef9c3382.png", path: "images/hero/home-slideshow-Jeanna-Michael.png" },
  { url: CACHE + "53/home-slideshow-Danielle-Travis-53623951.png", path: "images/hero/home-slideshow-Danielle-Travis.png" },
  { url: CACHE + "f0/home-hero-AOW-f0928b29.png", path: "images/hero/home-hero-AOW.png" },
];
// Portfolio cover images keep their (already descriptive) filenames.
const covers = [
  "Lisa-and-Bryan-Color.png", "Asheley-and-Ben.png", "AOW.png", "Danielle-and-Travis-Wedding.png",
  "Madison-and-Tyler.png", "Kristie-and-Zack-Wedding.png", "Katie-and-Royeric2.png", "Heather-and-John.png",
  "Karen-and-Nate-3.png", "Jeanna-and-Michael.png", "Jennifer-and-Marlo.png", "Mary-Kate-abd-Marcus.png",
];
covers.forEach((f) => singles.push({ url: UP + f, path: "images/covers/" + f }));

async function download(url, destRel) {
  const dest = path.join(ASSETS, destRel);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return "skip";
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return "ok";
}

// Build the full job list (galleries + singles) -> { url, destRel, localPath }
const jobs = [];
const localGalleries = {};
for (const [slug, urls] of Object.entries(galleries)) {
  localGalleries[slug] = [];
  for (const url of urls) {
    if (url.startsWith("/assets/")) { localGalleries[slug].push(url); continue; }
    const base = url.split("/").pop();
    const destRel = `weddings/${slug}/${base}`;
    jobs.push({ url, destRel });
    localGalleries[slug].push(`/assets/${destRel}`);
  }
}
singles.forEach((s) => jobs.push({ url: s.url, destRel: s.path }));

async function run() {
  let ok = 0, skip = 0, fail = 0;
  const failures = [];
  const CONC = 12;
  let i = 0;
  async function worker() {
    while (i < jobs.length) {
      const job = jobs[i++];
      try {
        const r = await download(job.url, job.destRel);
        r === "ok" ? ok++ : skip++;
      } catch (e) {
        fail++; failures.push(e.message);
      }
      if ((ok + skip + fail) % 100 === 0) console.log(`  …${ok + skip + fail}/${jobs.length}`);
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));

  // Rewrite galleries data with local paths
  const out =
    "// Local gallery photos (downloaded from amorecoordination.com). Regenerate via tools/fetch-images.js\n" +
    "module.exports = " + JSON.stringify(localGalleries, null, 2) + ";\n";
  fs.writeFileSync(path.join(ROOT, "src", "_data", "galleries.js"), out);

  console.log(`\nDone. downloaded=${ok} skipped=${skip} failed=${fail} total=${jobs.length}`);
  if (failures.length) console.log("Failures:\n" + failures.slice(0, 20).join("\n"));
}
run();
