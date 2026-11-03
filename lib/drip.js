// Blog drip: which posts in src/blog/ are live today.
//
// A post is live when its front-matter `date` (the internal publish date, never shown on the
// site) is on or before today in Pacific time AND, for drip posts, it is marked `approved: true`.
// Posts that aren't live are skipped entirely by the preprocessor in .eleventy.js: no page,
// no collection entry, no sitemap line. The daily GitHub Action
// (.github/workflows/daily-publish.yml) rebuilds production each morning, so each post goes
// live on its own day once Amy has approved it.
//
// Local preview of everything:  DRIP_PREVIEW=1 npx @11ty/eleventy --serve
// Check a day as if approved:   DRIP_TODAY=2026-11-20 DRIP_ASSUME_APPROVED=1 npx @11ty/eleventy --dryrun
// Simulate a day:               DRIP_TODAY=2026-12-01 npx @11ty/eleventy
const fs = require("fs");
const path = require("path");

const BLOG_DIR = path.join(__dirname, "..", "src", "blog");

function todayPacific() {
  if (/^\d{4}-\d{2}-\d{2}$/.test(process.env.DRIP_TODAY || "")) return process.env.DRIP_TODAY;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

// Minimal front-matter read: only the flat keys the drip needs.
function frontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const out = {};
  if (!m) return out;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*?)\s*$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

// Drip posts (they have a `cluster`) stay hidden until Amy approves them: `approved: true`.
// The original 11 posts have no cluster and are always live.
// DRIP_ASSUME_APPROVED=1 skips the approval check (for testing a schedule before review).
function isLiveFm(fm, today = todayPacific()) {
  if (process.env.DRIP_PREVIEW === "1") return true;
  if (fm.cluster && String(fm.approved).toLowerCase() !== "true" && process.env.DRIP_ASSUME_APPROVED !== "1") return false;
  const d = String(fm.date || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= today;
}

// Every post file with its slug, parsed front matter and live state. Read fresh each build.
function allPosts() {
  const today = todayPacific();
  return fs.readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const fm = frontMatter(fs.readFileSync(path.join(BLOG_DIR, f), "utf8"));
      return { file: f, slug: f.replace(/\.md$/, ""), fm, live: isLiveFm(fm, today) };
    });
}

module.exports = { todayPacific, frontMatter, isLiveFm, allPosts, BLOG_DIR };
