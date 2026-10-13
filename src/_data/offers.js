// Private event offers. Each entry renders /offer/<slug>/ (noindex, unlinked,
// left out of the sitemap) and is the source of truth for /api/offer.
// To add an event: copy an entry, change the fields, then run
// `node tools/offer-qr.js` to generate its QR code.
//
// `code` is never written into the page HTML. Guests get it only after
// they submit the form, both on screen and in their confirmation email.
// `expires` is one fixed deadline for everyone (Pacific time). Include the offset.

module.exports = [
  {
    slug: "black-pearl",
    event: "Black Pearl",
    headline: "Welcome, Black Pearl guest",
    intro:
      "I hope you're enjoying the Black Pearl event. As a thank-you for being here, you're invited to an exclusive offer on your wedding coordination with Amore Coordination.",
    discount: "10%",
    code: "BLACKPEARL",
    // TODO confirm with Amy: which packages, the deadline, and whether it stacks
    appliesTo: "any Amore Coordination wedding package",
    expires: "2026-11-30T23:59:00-08:00",
    combinable: false,
  },
];
