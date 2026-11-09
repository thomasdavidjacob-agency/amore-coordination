// Options for the contact form's two dropdowns. The page renders these lists
// (src/_data/inquiryOptions.js re-exports them) and api/contact.js accepts only
// these exact values, so a bot can't put free text or links in either field.
module.exports = {
  packages: [
    'Micro Wedding',
    'PNW Elopement',
    'Adoration (partial planning)',
    'Endearment (day-of coordination)',
    'Unforgettable (full-service planning)',
    'Holiday event',
    'Not sure yet',
  ],
  sources: [
    'Google search',
    'Instagram',
    'Pinterest',
    'The Knot',
    'WeddingWire',
    'Zola',
    'My photographer, venue or another vendor',
    'A friend or past couple',
    'Other',
  ],
}
