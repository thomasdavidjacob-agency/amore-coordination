// Generates a print-ready QR code for every entry in src/_data/offers.js.
// Output: qr/<slug>.svg (vector, for the printer) + qr/<slug>.png (2000px preview).
// Each QR points at the event's private page, tagged with UTM params so
// the lead email shows that the guest came from the printed card.
//
//   node tools/offer-qr.js

const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const offers = require("../src/_data/offers.js");
const site = require("../src/_data/site.js");

const outDir = path.join(__dirname, "..", "qr");
fs.mkdirSync(outDir, { recursive: true });

const opts = { errorCorrectionLevel: "H", margin: 2, color: { dark: "#2b2723", light: "#ffffff" } };

(async () => {
  for (const o of offers) {
    const url = `${site.url}/offer/${o.slug}/?utm_source=${o.slug}&utm_medium=qr&utm_campaign=event-offer`;
    await QRCode.toFile(path.join(outDir, `${o.slug}.svg`), url, { ...opts, type: "svg" });
    await QRCode.toFile(path.join(outDir, `${o.slug}.png`), url, { ...opts, width: 2000 });
    console.log(`${o.slug}: ${url}`);
  }
})();
