const { allPosts, todayPacific } = require("./lib/drip");
const clusters = require("./src/_data/clusters");

// Pages that always exist (internal links to these are never stripped).
const SITE_PATH = /^\/(?:|about|portfolio|services|blog|contact|thank-you)(?:\/|$)|^\/services\/|^\/portfolio\/|^\/blog\/topic\//;

module.exports = function (eleventyConfig) {
  // Copy assets straight through to the output
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/favicon.svg");

  // ---- Blog drip (see lib/drip.js) ----------------------------------------------------
  const posts = allPosts();
  const liveSlugs = new Set(posts.filter((p) => p.live).map((p) => p.slug));
  const held = posts.filter((p) => !p.live).sort((a, b) => String(a.fm.date).localeCompare(String(b.fm.date)));
  console.log(`[drip] today (Pacific) ${todayPacific()} · live ${liveSlugs.size} · held ${held.length}` +
    (held.length ? ` (next: ${String(held[0].fm.date).slice(0, 10)} ${held[0].slug}${held[0].fm.approved === "false" ? ", NOT approved" : ""})` : ""));
  const lintErrors = [];

  // Runs on every markdown template before rendering. Blog posts that aren't live are dropped
  // from the build entirely; live posts get links to not-yet-live posts unwrapped to plain text
  // (they relink on the rebuild after the target goes live) and are linted for internal links.
  eleventyConfig.addPreprocessor("blog-drip", "md", (data, content) => {
    if (!data.page.inputPath.replace(/\\/g, "/").includes("/src/blog/")) return;
    if (!liveSlugs.has(data.page.fileSlug)) return false;

    const out = content.replace(/\[([^\]]+)\]\(\/blog\/([a-z0-9-]+)\/?(#[^)]*)?\)/g, (m, text, slug) =>
      slug === "topic" || liveSlugs.has(slug) ? m : text);

    // Lint only drip posts (they carry a cluster); the original 11 posts predate the rules.
    if (data.cluster) {
      const where = `src/blog/${data.page.fileSlug}.md`;
      const links = [...out.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]);
      const postLinks = new Set(links.filter((l) => /^\/blog\/[a-z0-9-]+\/?$/.test(l) && !l.startsWith("/blog/topic/")));
      if (!clusters[data.cluster]) lintErrors.push(`${where}: unknown cluster "${data.cluster}"`);
      if (!links.some((l) => l.startsWith("/services/"))) lintErrors.push(`${where}: no link to a service page`);
      if (data.service && !links.some((l) => l.startsWith(data.service.split("#")[0]) && (!data.service.includes("#") || l === data.service)))
        lintErrors.push(`${where}: missing its mapped service link ${data.service}`);
      if (postLinks.size < 2) lintErrors.push(`${where}: links to ${postLinks.size} live post(s); needs at least 2`);
      if (!links.includes("/contact/")) lintErrors.push(`${where}: no in-text link to /contact/`);
      if (!data.description || data.description.length < 110 || data.description.length > 165)
        lintErrors.push(`${where}: meta description must be 110-165 characters (has ${(data.description || "").length})`);
      if ((data.title || "").length > 70) lintErrors.push(`${where}: title over 70 characters`);
      for (const l of links) if (!SITE_PATH.test(l) && !/^\/blog\/[a-z0-9-]+\/?$/.test(l) && !l.startsWith("/assets/"))
        lintErrors.push(`${where}: internal link to unknown path ${l}`);
      // No dates on posts (Phuong, 2026-11-02). A bare month or year ("in January", "2027") is fine.
      if (/\b(19|20)\d\d-\d\d-\d\d\b|\b(January|February|March|April|May|June|July|August|September|October|November|December)\.? \d{1,2}(st|nd|rd|th)?,? (19|20)\d\d\b/.test(out))
        lintErrors.push(`${where}: contains a date (no dates on posts)`);
    }
    return out;
  });

  // Fail the build if any live drip post breaks the linking rules (production keeps the last good build).
  eleventyConfig.on("eleventy.before", () => { lintErrors.length = 0; });
  eleventyConfig.on("eleventy.after", () => {
    if (lintErrors.length) {
      console.error("[drip] link lint failed:\n  " + lintErrors.join("\n  "));
      throw new Error(`[drip] ${lintErrors.length} link-lint error(s)`);
    }
  });

  // Blog collection: live posts only (the preprocessor drops the rest), newest first.
  eleventyConfig.addCollection("blog", (collectionApi) =>
    collectionApi.getFilteredByGlob("src/blog/*.md").filter((p) => p.url).sort((a, b) => b.date - a.date)
  );

  // Clusters that have at least one live post, each with its posts (pillar first, then newest).
  eleventyConfig.addCollection("liveClusters", (collectionApi) => {
    const blog = collectionApi.getFilteredByGlob("src/blog/*.md").filter((p) => p.url);
    return Object.entries(clusters)
      .map(([key, c]) => ({
        key, ...c,
        posts: blog.filter((p) => p.data.cluster === key)
          .sort((a, b) => (b.data.pillar === true) - (a.data.pillar === true) || b.date - a.date),
      }))
      .filter((c) => c.posts.length);
  });

  // Up to n live posts related to this one: same cluster first, then the newest others.
  eleventyConfig.addFilter("relatedPosts", (blog, page, cluster, n = 3) => {
    const others = (blog || []).filter((p) => p.url !== page.url);
    const same = others.filter((p) => cluster && p.data.cluster === cluster);
    const rest = others.filter((p) => !same.includes(p));
    return same.concat(rest).slice(0, n);
  });

  // Newest live posts whose cluster maps to this service page.
  eleventyConfig.addFilter("postsForService", (blog, servicePath, n = 3) =>
    (blog || []).filter((p) => p.data.service === servicePath || (clusters[p.data.cluster] || {}).service === servicePath).slice(0, n)
  );

  eleventyConfig.addWatchTarget("./lib/");

  // Absolute URL helper (canonical / OG / sitemap)
  eleventyConfig.addFilter("absUrl", (path, base) => {
    try {
      return new URL(path, base).href;
    } catch (e) {
      return path;
    }
  });

  // Human-readable date, e.g. "May 26, 2026" (not used on blog posts: no dates on the blog)
  eleventyConfig.addFilter("readableDate", (d) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    })
  );

  // Offer deadline in Pacific time, e.g. "November 30, 2026"
  eleventyConfig.addFilter("pacificDate", (d) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Los_Angeles",
    })
  );

  // ISO date for schema/sitemap
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString());

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
};
