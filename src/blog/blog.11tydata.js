// Defaults for every post in src/blog/. Drafts and scheduled posts live here too;
// the "blog-drip" preprocessor in .eleventy.js drops any post that isn't live yet.
module.exports = {
  layout: "post.njk",
  author: "Amy Elizabeth Ha",
  permalink: "/blog/{{ page.fileSlug }}/",
};
