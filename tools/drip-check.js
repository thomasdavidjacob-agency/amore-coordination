// Checks every blog-drip draft on its own publish day: builds the site as it will look that
// morning (all drafts treated as approved) and fails if any post breaks the linking rules.
//   node tools/drip-check.js            every distinct publish date
//   node tools/drip-check.js 2026-11-16 2026-11-22   only dates in that range
const { execFileSync } = require("child_process");
const { allPosts } = require("../lib/drip");
const [from = "0000", to = "9999"] = process.argv.slice(2);
const dates = [...new Set(allPosts().filter((p) => p.fm.cluster).map((p) => String(p.fm.date).slice(0, 10)))]
  .filter((d) => d >= from && d <= to).sort();
let bad = 0;
for (const d of dates) {
  try {
    execFileSync("npx", ["@11ty/eleventy", "--dryrun", "--quiet"], {
      env: { ...process.env, DRIP_TODAY: d, DRIP_ASSUME_APPROVED: "1" }, stdio: "pipe", shell: true,
    });
    console.log(`${d}  ok`);
  } catch (e) {
    bad++;
    const msg = String(e.stderr || e.stdout || e.message).split("\n").filter((l) => /src\/blog|lint|Error/.test(l)).slice(0, 12).join("\n  ");
    console.log(`${d}  FAIL\n  ${msg}`);
  }
}
console.log(bad ? `${bad} day(s) failed` : `all ${dates.length} day(s) pass`);
process.exit(bad ? 1 : 0);
