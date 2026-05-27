const portfolio = require("./portfolio.js");
const galleries = require("./galleries.js");

// Couples that have a real photo gallery — used to generate /portfolio/<slug>/ pages.
module.exports = portfolio
  .filter((p) => p.slug && galleries[p.slug] && galleries[p.slug].length)
  .map((p) => ({ ...p, photos: galleries[p.slug] }));
