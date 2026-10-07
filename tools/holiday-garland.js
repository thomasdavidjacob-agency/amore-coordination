// Generates the holiday-page line-art garlands (original artwork):
//   src/assets/holiday/garland-top.svg     evergreen + holly with hanging ornaments
//   src/assets/holiday/garland-bottom.svg  evergreen + holly + pinecones, growing upward
// Both tiles are seamless horizontally (everything is drawn at x-W, x, x+W).
// Run: node tools/holiday-garland.js
const fs = require("fs");
const path = require("path");

const STROKE = "#6e3d63"; // --plum
const FILL = "#fbf9f4"; // --paper, so ornaments sit in front of greenery
const W = 720;

let seed = 7;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rr = (a, b) => a + rnd() * (b - a);
const f = (n) => Math.round(n * 10) / 10;
const rad = (d) => (d * Math.PI) / 180;

// Fir sprig: gently curved stem with tapered needles angled forward.
function sprig(x, y, ang, len, s = 1) {
  const bend = rr(-0.25, 0.25);
  const pts = (u) => {
    const a = rad(ang) + bend * u;
    return [x + Math.cos(a) * len * u, y + Math.sin(a) * len * u, a];
  };
  let d = "";
  const [ex, ey] = pts(1);
  const [mx, my] = pts(0.5);
  d += `M${f(x)} ${f(y)}Q${f(mx + (mx - (x + ex) / 2))} ${f(my + (my - (y + ey) / 2))} ${f(ex)} ${f(ey)}`;
  const step = 4.2 * s;
  for (let u = 0.1; u <= 1; u += step / len) {
    const [px, py, a] = pts(u);
    const n = 9 * s * (1 - 0.5 * u) * rr(0.85, 1.1);
    for (const side of [-1, 1]) {
      // Needles curve slightly toward the tip, like a soft brush stroke.
      const na = a + side * rad(38 + rr(-6, 6));
      const ca = a + side * rad(55);
      const cx = px + Math.cos(ca) * n * 0.5, cy = py + Math.sin(ca) * n * 0.5;
      d += `M${f(px)} ${f(py)}Q${f(cx)} ${f(cy)} ${f(px + Math.cos(na) * n)} ${f(py + Math.sin(na) * n)}`;
    }
  }
  const ta = rad(ang) + bend;
  d += `M${f(ex)} ${f(ey)}l${f(Math.cos(ta) * 5 * s)} ${f(Math.sin(ta) * 5 * s)}`;
  return `<path d="${d}" stroke-width="0.65" stroke-opacity="0.8"/>`;
}

// Holly leaf with three points per side and a midrib.
function holly(x, y, ang, L = 34, Wd = 11) {
  const up = [];
  const xs = [0.22, 0.48, 0.74];
  let d = `M0 0`;
  let prev = 0;
  for (const k of xs) {
    d += `Q${f(L * (prev + k) / 2)} ${f(-Wd * 0.45)} ${f(L * k)} ${f(-Wd)}`;
    prev = k;
  }
  d += `Q${f(L * 0.88)} ${f(-Wd * 0.4)} ${L} 0`;
  prev = 1;
  for (const k of [...xs].reverse()) {
    d += `Q${f(L * (prev + k) / 2)} ${f(Wd * 0.45)} ${f(L * k)} ${f(Wd)}`;
    prev = k;
  }
  d += `Q${f(L * 0.1)} ${f(Wd * 0.4)} 0 0ZM0 0L${f(L * 0.9)} 0`;
  return `<path transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})" d="${d}"/>`;
}

const berries = (x, y, n = 3) => {
  let o = "";
  for (let i = 0; i < n; i++) {
    const a = rad(i * (360 / n) + rr(-20, 20));
    o += `<circle cx="${f(x + Math.cos(a) * 4.2)}" cy="${f(y + Math.sin(a) * 4.2)}" r="3.4" fill="${FILL}"/>`;
  }
  return o;
};

const cap = (x, y) =>
  `<rect x="${f(x - 4.5)}" y="${f(y)}" width="9" height="6" rx="1" fill="${FILL}"/>`;
const string = (x, y0, y1) => `<path d="M${f(x)} ${f(y0)}V${f(y1)}" stroke-width="0.8"/>`;

function ball(x, y0, len, r = 21) {
  const y = y0 + len, cy = y + 6 + r;
  let o = string(x, y0, y) + `<circle cx="${x}" cy="${f(cy)}" r="${r}" fill="${FILL}"/>` + cap(x, y);
  for (const off of [-0.32, 0.32]) {
    const yy = cy + r * off;
    const hw = Math.sqrt(r * r - (r * off) ** 2);
    o += `<path d="M${f(x - hw)} ${f(yy)}Q${x} ${f(yy + r * 0.18)} ${f(x + hw)} ${f(yy)}"/>`;
  }
  for (let i = -3; i <= 3; i++) o += `<circle cx="${f(x + i * 5)}" cy="${f(cy + 1.5 - Math.abs(i) * 0.4)}" r="1.1" fill="${STROKE}" stroke="none"/>`;
  return o;
}

function drop(x, y0, len) {
  const y = y0 + len + 6;
  const body = `M${x - 4} ${y}C${x - 22} ${y + 26} ${x - 20} ${y + 48} ${x} ${y + 78}C${x + 20} ${y + 48} ${x + 22} ${y + 26} ${x + 4} ${y}Z`;
  let o = string(x, y0, y - 6) + `<path d="${body}" fill="${FILL}"/>` + cap(x, y - 6);
  o += `<path d="M${x - 2} ${y + 2}C${x - 11} ${y + 28} ${x - 9} ${y + 50} ${x} ${y + 76}M${x + 2} ${y + 2}C${x + 11} ${y + 28} ${x + 9} ${y + 50} ${x} ${y + 76}"/>`;
  o += `<path d="M${x - 18} ${y + 36}H${x + 18}"/><circle cx="${x}" cy="${y + 84}" r="2.6" fill="${FILL}"/>`;
  return o;
}

function icicle(x, y0, len) {
  const y = y0 + len + 6;
  let o = string(x, y0, y - 6) + cap(x, y - 6);
  o += `<path d="M${x - 3} ${y}Q${x - 12} ${y + 40} ${x} ${y + 100}Q${x + 12} ${y + 40} ${x + 3} ${y}Z" fill="${FILL}"/>`;
  o += `<path d="M${x} ${y + 2}V${y + 94}M${x - 5} ${y + 8}Q${x - 8} ${y + 40} ${x} ${y + 92}M${x + 5} ${y + 8}Q${x + 8} ${y + 40} ${x} ${y + 92}"/>`;
  return o;
}

function star(x, y0, len) {
  const cy = y0 + len + 34;
  const tips = [];
  for (let i = 0; i < 8; i++) {
    const a = rad(-90 + i * 45);
    const R = i === 0 ? 30 : i === 4 ? 46 : i % 2 ? 17 : 26;
    tips.push([x + Math.cos(a) * R, cy + Math.sin(a) * R]);
  }
  let d = "";
  tips.forEach(([tx, ty], i) => {
    const a = rad(-90 + i * 45 + 22.5);
    const ix = x + Math.cos(a) * 6.5, iy = cy + Math.sin(a) * 6.5;
    d += `${i ? "L" : "M"}${f(tx)} ${f(ty)}L${f(ix)} ${f(iy)}`;
  });
  let o = string(x, y0, cy - 30) + `<path d="${d}Z" fill="${FILL}"/>`;
  o += `<path d="${tips.map(([tx, ty]) => `M${x} ${f(cy)}L${f(tx)} ${f(ty)}`).join("")}" stroke-width="0.7"/>`;
  return o;
}

function curl(x, y0, len) {
  let d = `M${x} ${y0}`;
  for (let t = 0; t <= 1; t += 0.02) {
    const yy = y0 + t * len;
    const xx = x + Math.sin(t * Math.PI * 5) * 7 * (1 - t * 0.5);
    d += `L${f(xx)} ${f(yy)}`;
  }
  return `<path d="${d}" stroke-width="0.9"/>`;
}

function bow(x, y) {
  return `<path fill="${FILL}" d="M${x} ${y}C${x - 10} ${y - 16} ${x - 30} ${y - 12} ${x - 26} ${y}C${x - 24} ${y + 8} ${x - 10} ${y + 6} ${x} ${y}ZM${x} ${y}C${x + 10} ${y - 16} ${x + 30} ${y - 12} ${x + 26} ${y}C${x + 24} ${y + 8} ${x + 10} ${y + 6} ${x} ${y}Z"/>` +
    `<path d="M${x - 2} ${y + 2}Q${x - 10} ${y + 22} ${x - 16} ${y + 36}M${x + 2} ${y + 2}Q${x + 10} ${y + 22} ${x + 18} ${y + 34}"/>` +
    `<circle cx="${x}" cy="${y}" r="3.5" fill="${FILL}"/>`;
}

// Pinecone: tapered body with overlapping scale rows.
function pinecone(x, y, ang) {
  let o = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})">`;
  o += `<path fill="${FILL}" d="M0 -24C12 -22 15 -4 12 8C9 18 4 24 0 25C-4 24 -9 18 -12 8C-15 -4 -12 -22 0 -24Z"/>`;
  for (let r = -16; r <= 18; r += 6) {
    const hw = 13 * Math.sin(((r + 24) / 49) * Math.PI) * 0.92;
    for (let c = -hw; c < hw - 1; c += 6) {
      o += `<path d="M${f(c)} ${r}Q${f(c + 3)} ${r + 5} ${f(Math.min(c + 6, hw))} ${r}" stroke-width="0.8"/>`;
    }
  }
  return o + `<path d="M0 -24V-30"/></g>`;
}

// Scale an ornament around its hanging point.
const sc = (s, x, y, body) => `<g transform="translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})">${body}</g>`;

// Draw a layer at x-W, x, x+W so the tile repeats seamlessly.
const wrap = (fn) => [-W, 0, W].map((dx) => `<g transform="translate(${dx} 0)">${fn()}</g>`).join("");

const svg = (h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" fill="none" stroke="${STROKE}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;

// ---- Top garland ----
seed = 11;
const greensTop = [];
// Two depths of sprigs: long ones drooping along the line, shorter ones hanging down.
for (let x = -20; x < W; x += rr(30, 46)) {
  const dir = rnd() < 0.5 ? rr(10, 40) : rr(140, 170);
  greensTop.push(sprig(x, rr(0, 18), dir, rr(80, 120), rr(0.95, 1.15)));
}
for (let x = 0; x < W; x += rr(34, 52)) greensTop.push(sprig(x, rr(8, 24), rr(55, 125), rr(45, 75), rr(0.85, 1)));
for (let x = 30; x < W; x += rr(95, 135)) {
  const y = rr(34, 50);
  greensTop.push(holly(x, y, rr(20, 60), 38, 12), holly(x + 4, y, rr(120, 160), 38, 12), berries(x + 2, y + 3));
}
for (let x = 80; x < W; x += rr(90, 130)) greensTop.push(berries(x, rr(58, 72), 3));
const topBody =
  wrap(() => greensTop.join("")) +
  wrap(() =>
    sc(1.35, 70, 62, ball(70, 62, 70)) +
    curl(160, 56, 90) +
    sc(1.3, 240, 62, drop(240, 62, 40)) +
    sc(1.35, 360, 62, star(360, 62, 32)) +
    curl(455, 58, 110) +
    sc(1.2, 535, 62, ball(535, 62, 95, 19)) +
    sc(1.25, 640, 62, icicle(640, 62, 30)) +
    sc(1.15, 360, 46, bow(360, 46))
  );
fs.mkdirSync(path.join(__dirname, "../src/assets/holiday"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "../src/assets/holiday/garland-top.svg"), svg(320, topBody));

// ---- Bottom garland ----
seed = 23;
const H2 = 170;
const greensBot = [];
for (let x = -20; x < W; x += rr(26, 40)) greensBot.push(sprig(x, H2 + rr(0, 10), rr(-165, -15), rr(70, 115), rr(0.95, 1.15)));
for (let x = 40; x < W; x += rr(100, 140)) {
  const y = H2 - rr(45, 70);
  greensBot.push(holly(x, y, rr(-70, -25), 38, 12), holly(x - 4, y, rr(-155, -110), 38, 12), berries(x, y - 2));
}
for (const [x, a] of [[160, -18], [445, 22], [655, -8]]) greensBot.push(pinecone(x, H2 - 34, a));
fs.writeFileSync(path.join(__dirname, "../src/assets/holiday/garland-bottom.svg"), svg(H2, wrap(() => greensBot.join(""))));

console.log("wrote src/assets/holiday/garland-top.svg and garland-bottom.svg");
