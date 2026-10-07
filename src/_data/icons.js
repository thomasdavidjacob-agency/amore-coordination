// Thin-line package icons. 48×48 viewBox, stroke = currentColor, so they take
// the color of whatever they sit in. Referenced by `icon:` in services.js.
const svg = (body) =>
  `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

const arm = (deg) =>
  `<path transform="rotate(${deg} 24 24)" d="M24 24V9M24 14l-3-3M24 14l3-3"/>`;

module.exports = {
  // Endearment — day-of: pocket watch
  watch: svg(
    `<circle cx="24" cy="6.5" r="2.5"/><path d="M24 9v4"/><circle cx="24" cy="27" r="14"/>` +
    `<path d="M24 15v1.6M36 27h-1.6M24 39v-1.6M12 27h1.6"/><path d="M24 27v-7.5M24 27l5 3"/>` +
    `<circle cx="24" cy="27" r="0.9" fill="currentColor" stroke="none"/>`
  ),
  // Adoration — partial planning: interlocking rings
  rings: svg(
    `<circle cx="19" cy="28" r="10"/><circle cx="29" cy="28" r="10"/>` +
    `<path d="M26.5 15.5 29 13l2.5 2.5L29 18z"/>`
  ),
  // Unforgettable — full service: faceted diamond
  diamond: svg(
    `<path d="M9 18 16 10h16l7 8-15 21z"/><path d="M9 18h30"/>` +
    `<path d="M16 10l4 8 4-8 4 8 4-8"/><path d="M20 18l4 21 4-21"/>`
  ),
  // Micro Wedding: two champagne flutes, touching
  flutes: svg(
    `<g transform="translate(21 4) rotate(12)"><path d="M-4 8c0 10 1.5 14 4 15 2.5-1 4-5 4-15z"/><path d="M-3.6 13h7.2M0 23v13M-4.5 36h9"/></g>` +
    `<g transform="translate(27 4) rotate(-12)"><path d="M-4 8c0 10 1.5 14 4 15 2.5-1 4-5 4-15z"/><path d="M-3.6 13h7.2M0 23v13M-4.5 36h9"/></g>` +
    `<path d="M24 1.5v3M22.5 3h3"/>`
  ),
  // PNW Elopement: mountains, snowcap, sun
  mountains: svg(
    `<path d="M3 38h42"/><path d="M5 38 18 16l8 12 5-7 12 17"/>` +
    `<path d="M14.8 21l2.2 1.6 2-2 2.3.6"/><circle cx="35" cy="11" r="3"/>`
  ),
  // Holiday events: snowflake
  snowflake: svg([0, 60, 120, 180, 240, 300].map(arm).join("")),
};
