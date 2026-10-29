// Instagram ad (1080x1350) in the site's style: ivory paper, plum + sage, Cormorant/Jost,
// one wedding photo in an arch, original line-art florals (roses, buds, leaves) drawn here.
//   node tools/ad-floral.mjs [photo-path] [out-dir]
// Writes ad-amore.html + ad-amore.png (rendered with headless Edge).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = resolve(import.meta.dirname, '..');
const photo = process.argv[2] || join(REPO, 'src/assets/images/hero/home-hero-Lisa-Bryan.jpg');
const outDir = process.argv[3] || join(REPO, 'ads');
const PHOTO_POS = process.env.PHOTO_POS || '36% 45%';

const C = { paper: '#fbf9f4', ink: '#2b2723', soft: '#5c554d', line: '#e4dcd2', plum: '#6e3d63', plumDeep: '#582f50', sage: '#7e9070', sageDeep: '#65775a', blush: '#c98a9b' };

let seed = 11;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rr = (a, b) => a + rnd() * (b - a);
const f = (n) => Math.round(n * 10) / 10;
const rad = (d) => (d * Math.PI) / 180;
const P = (cx, cy, r, a) => [cx + Math.cos(rad(a)) * r, cy + Math.sin(rad(a)) * r];

// Open rose: a blush wash, outer petals as scallops, a loose spiral heart.
function rose(cx, cy, r, rot = 0) {
  const wash = `<circle cx="${f(cx + r * 0.1)}" cy="${f(cy + r * 0.08)}" r="${f(r * 0.9)}" fill="${C.blush}" fill-opacity="0.32" filter="url(#soft)"/>`;
  // A closed ring of scalloped petals, filled so the rose sits in front of the photo.
  const ring = (k, n, off, wobble) => {
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = rot + off + i * (360 / n), b = a + 360 / n;
      const rk = r * k * rr(1 - wobble, 1);
      const [x0, y0] = P(cx, cy, r * k * 0.62, a);
      const [c1x, c1y] = P(cx, cy, rk * 1.12, a + 360 / n * 0.12);
      const [c2x, c2y] = P(cx, cy, rk * 1.12, a + 360 / n * 0.88);
      const [x1, y1] = P(cx, cy, r * k * 0.62, b);
      d += `${i ? 'L' : 'M'}${f(x0)} ${f(y0)}C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(x1)} ${f(y1)}`;
    }
    return `<path d="${d}Z" fill="${C.paper}" fill-opacity="0.82" stroke="${C.plum}" stroke-width="1.5" stroke-linejoin="round"/>`;
  };
  let out = wash + ring(1, 5, 0, 0.1) + ring(0.74, 4, 30, 0.08);
  let d = '';
  // inner cupped petals
  for (let i = 0; i < 2; i++) {
    const a = rot + 70 + i * 170;
    const [x0, y0] = P(cx, cy, r * 0.3, a);
    const [cx1, cy1] = P(cx, cy, r * 0.62, a + 60);
    const [x1, y1] = P(cx, cy, r * 0.3, a + 125);
    d += `M${f(x0)} ${f(y0)}Q${f(cx1)} ${f(cy1)} ${f(x1)} ${f(y1)}`;
  }
  // spiral heart
  [[0.12, 30], [0.2, 150], [0.28, 260]].forEach(([k, a0]) => {
    const [sx, sy] = P(cx, cy, r * k, rot + a0);
    const [ex, ey] = P(cx, cy, r * k, rot + a0 + 230);
    d += `M${f(sx)} ${f(sy)}A${f(r * k)} ${f(r * k)} 0 1 1 ${f(ex)} ${f(ey)}`;
  });
  return `${out}<path d="${d}" fill="none" stroke="${C.plum}" stroke-width="1.5" stroke-linecap="round"/>`;
}

// Closed bud on a short stem, with two sepals.
function bud(x, y, ang, s = 1) {
  const L = 34 * s, W = 13 * s, a = rad(ang);
  const tip = [x + Math.cos(a) * L, y + Math.sin(a) * L];
  const n = [-Math.sin(a), Math.cos(a)];
  const side = (k) => [x + Math.cos(a) * L * 0.45 + n[0] * W * k, y + Math.sin(a) * L * 0.45 + n[1] * W * k];
  const [l1, l2] = side(1), [r1, r2] = side(-1);
  const body = `M${f(x)} ${f(y)}Q${f(l1)} ${f(l2)} ${f(tip[0])} ${f(tip[1])}Q${f(r1)} ${f(r2)} ${f(x)} ${f(y)}Z`;
  const fold = `M${f(x + Math.cos(a) * L * 0.2)} ${f(y + Math.sin(a) * L * 0.2)}Q${f(x + Math.cos(a) * L * 0.6 + n[0] * W * 0.5)} ${f(y + Math.sin(a) * L * 0.6 + n[1] * W * 0.5)} ${f(tip[0])} ${f(tip[1])}`;
  const sep = [1, -1].map((k) => `M${f(x)} ${f(y)}q${f(Math.cos(a) * L * 0.3 + n[0] * W * 0.9 * k)} ${f(Math.sin(a) * L * 0.3 + n[1] * W * 0.9 * k)} ${f(Math.cos(a) * L * 0.5 + n[0] * W * 0.3 * k)} ${f(Math.sin(a) * L * 0.5 + n[1] * W * 0.3 * k)}`).join('');
  return `<path d="${body}" fill="${C.blush}" fill-opacity="0.22" stroke="${C.plum}" stroke-width="1.5"/>`
    + `<path d="${fold}" fill="none" stroke="${C.plum}" stroke-width="1.2"/>`
    + `<path d="${sep}" fill="none" stroke="${C.sageDeep}" stroke-width="1.4" stroke-linecap="round"/>`;
}

// Leaf with a midrib and a few veins.
function leaf(x, y, ang, L = 70, W = 22) {
  const a = rad(ang), n = [-Math.sin(a), Math.cos(a)];
  const at = (u, k) => [x + Math.cos(a) * L * u + n[0] * W * k, y + Math.sin(a) * L * u + n[1] * W * k];
  const tip = at(1, 0);
  const [c1x, c1y] = at(0.45, 1.1), [c2x, c2y] = at(0.5, -1.1);
  let d = `M${f(x)} ${f(y)}Q${f(c1x)} ${f(c1y)} ${f(tip[0])} ${f(tip[1])}Q${f(c2x)} ${f(c2y)} ${f(x)} ${f(y)}Z`;
  let v = `M${f(x)} ${f(y)}L${f(at(0.9, 0)[0])} ${f(at(0.9, 0)[1])}`;
  [0.3, 0.52, 0.72].forEach((u) => [1, -1].forEach((k) => {
    const [sx, sy] = at(u, 0), [ex, ey] = at(u + 0.14, 0.42 * k * (1.1 - u));
    v += `M${f(sx)} ${f(sy)}L${f(ex)} ${f(ey)}`;
  }));
  return `<path d="${d}" fill="${C.sage}" fill-opacity="0.13" stroke="${C.sageDeep}" stroke-width="1.5" stroke-linejoin="round"/>`
    + `<path d="${v}" fill="none" stroke="${C.sageDeep}" stroke-width="1" stroke-opacity="0.8" stroke-linecap="round"/>`;
}

// Trailing sprig: curved stem with small paired leaves.
function sprig(x, y, ang, len, bendDeg = 20) {
  const a0 = rad(ang), a1 = rad(ang + bendDeg);
  const pt = (u) => { const a = a0 + (a1 - a0) * u; return [x + Math.cos(a0) * len * u + (Math.cos(a) - Math.cos(a0)) * len * 0.3 * u, y + Math.sin(a0) * len * u + (Math.sin(a) - Math.sin(a0)) * len * 0.3 * u, a]; };
  const [ex, ey] = pt(1), [mx, my] = pt(0.5);
  let out = `<path d="M${f(x)} ${f(y)}Q${f(2 * mx - (x + ex) / 2)} ${f(2 * my - (y + ey) / 2)} ${f(ex)} ${f(ey)}" fill="none" stroke="${C.sageDeep}" stroke-width="1.4" stroke-linecap="round"/>`;
  for (let u = 0.22; u < 0.95; u += 0.19) {
    const [px, py, a] = pt(u);
    const deg = (a * 180) / Math.PI, s = 1 - u * 0.45;
    out += leaf(px, py, deg - 48, 30 * s, 9 * s) + leaf(px, py, deg + 48, 30 * s, 9 * s);
  }
  return out + leaf(ex, ey, (pt(1)[2] * 180) / Math.PI, 26, 8);
}

// Tiny five-petal filler blossom.
function blossom(x, y, r = 9) {
  let d = '';
  for (let i = 0; i < 5; i++) {
    const a = i * 72 + 18;
    const [x0, y0] = P(x, y, r * 0.25, a - 30), [c1x, c1y] = P(x, y, r * 1.3, a - 22), [c2x, c2y] = P(x, y, r * 1.3, a + 22), [x1, y1] = P(x, y, r * 0.25, a + 30);
    d += `M${f(x0)} ${f(y0)}C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(x1)} ${f(y1)}`;
  }
  return `<path d="${d}" fill="${C.paper}" stroke="${C.plum}" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="${f(r * 0.18)}" fill="${C.plum}"/>`;
}

// ---- Layout ----
const W = 1080, H = 1350;
const arch = { x: 225, y: 262, w: 630, h: 790 };
const ax0 = arch.x, ax1 = arch.x + arch.w, ayB = arch.y + arch.h;
const yB = ayB - 46; // bottom cluster sits a little above the arch foot so it clears the headline

// Bottom-left cluster, anchored on the arch's lower-left corner.
const bl = [
  sprig(ax0 + 30, yB - 10, -100, 230, -14),
  sprig(ax0 + 60, yB + 10, -6, 210, 8),
  leaf(ax0 + 10, yB - 20, -150, 92, 28), leaf(ax0 + 40, yB + 6, 165, 88, 26),
  leaf(ax0 + 70, yB - 30, -60, 80, 24), leaf(ax0 + 110, yB + 8, 20, 84, 25),
  leaf(ax0 - 10, yB + 30, 140, 70, 21),
  bud(ax0 - 40, yB - 70, -125, 1.1), bud(ax0 + 150, yB - 22, -20, 0.95),
  rose(ax0 + 52, yB - 12, 62, 12), rose(ax0 - 32, yB + 28, 40, 70),
  blossom(ax0 + 118, yB + 40, 11), blossom(ax0 - 64, yB - 18, 9),
].join('');

// Top-right cluster, smaller, on the arch's right shoulder.
const trx = ax1 - 46, tryy = arch.y + 150;
const tr = [
  sprig(trx, tryy, -70, 170, 16), sprig(trx + 10, tryy + 20, 70, 150, -12),
  leaf(trx + 6, tryy - 8, -20, 78, 23), leaf(trx - 6, tryy + 12, 125, 70, 21), leaf(trx + 14, tryy + 14, 40, 66, 20),
  bud(trx + 44, tryy - 52, -45, 0.9),
  rose(trx, tryy, 44, 40), blossom(trx - 40, tryy - 40, 9),
].join('');

const img = `data:image/jpeg;base64,${readFileSync(photo).toString('base64')}`;
const r = arch.w / 2;
const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;overflow:hidden;background:${C.paper}}
  .frame{position:absolute;inset:34px;border:1px solid ${C.line}}
  .eyebrow{position:absolute;top:84px;width:100%;text-align:center;font:400 19px/1 Jost,sans-serif;letter-spacing:.32em;text-transform:uppercase;color:${C.sageDeep}}
  .brand{position:absolute;top:124px;width:100%;text-align:center;font:600 66px/1 "Cormorant Garamond",serif;color:${C.plumDeep};letter-spacing:.01em}
  .brand em{font-weight:500;color:${C.plum}}
  .arch{position:absolute;left:${arch.x}px;top:${arch.y}px;width:${arch.w}px;height:${arch.h}px;border-radius:${r}px ${r}px 0 0;
        background:url(${img}) ${PHOTO_POS}/cover no-repeat}
  .arch-line{position:absolute;left:${arch.x - 16}px;top:${arch.y - 16}px;width:${arch.w + 32}px;height:${arch.h + 16}px;
        border:1.5px solid ${C.plum};border-bottom:0;border-radius:${r + 16}px ${r + 16}px 0 0;opacity:.55}
  svg{position:absolute;inset:0}
  .head{position:absolute;top:${ayB + 56}px;width:100%;text-align:center;font:italic 500 58px/1.1 "Cormorant Garamond",serif;color:${C.ink}}
  .tag{position:absolute;top:${ayB + 134}px;width:100%;text-align:center;font:400 19px/1 Jost,sans-serif;letter-spacing:.34em;text-transform:uppercase;color:${C.plum}}
  .url{position:absolute;bottom:64px;width:100%;text-align:center;font:300 22px/1 Jost,sans-serif;letter-spacing:.12em;color:${C.soft}}
  .rule{position:absolute;top:${ayB + 168}px;left:50%;width:56px;margin-left:-28px;border-top:1px solid ${C.sage}}
</style></head><body>
<div class="frame"></div>
<p class="eyebrow">Portland, Oregon · Wedding &amp; Event Planning</p>
<p class="brand">Amore <em>Coordination</em></p>
<div class="arch-line"></div>
<div class="arch"></div>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter></defs>${bl}${tr}</svg>
<p class="head">Your day, beautifully held.</p>
<p class="tag">Plan · Create · Inspire</p>
<div class="rule"></div>
<p class="url">amorecoordination.com</p>
</body></html>`;

mkdirSync(outDir, { recursive: true });
const htmlPath = join(outDir, 'ad-amore.html'), pngPath = join(outDir, 'ad-amore.png');
writeFileSync(htmlPath, html);
const edge = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find(existsSync);
execFileSync(edge, ['--headless=new', '--hide-scrollbars', `--screenshot=${pngPath}`, `--window-size=${W},${H}`, '--force-device-scale-factor=1', '--virtual-time-budget=5000', pathToFileURL(htmlPath).href], { stdio: 'ignore' });
console.log(pngPath);
