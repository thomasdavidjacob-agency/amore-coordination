module.exports = function (eleventyConfig) {
  // Copy assets straight through to the output
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/favicon.svg");

  // Blog collection, newest first
  eleventyConfig.addCollection("blog", (collectionApi) =>
    collectionApi.getFilteredByGlob("src/blog/*.md").reverse()
  );

  // Absolute URL helper (canonical / OG / sitemap)
  eleventyConfig.addFilter("absUrl", (path, base) => {
    try {
      return new URL(path, base).href;
    } catch (e) {
      return path;
    }
  });

  // Human-readable date, e.g. "May 26, 2026"
  eleventyConfig.addFilter("readableDate", (d) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
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
