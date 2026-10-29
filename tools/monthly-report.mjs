// Monthly website report for Amy, built from Vercel Web Analytics.
//   node tools/monthly-report.mjs 2026-10            → that month vs the month before
//   node tools/monthly-report.mjs 2026-10 --out <dir>
// Needs the Vercel CLI logged in to the agency account. Writes <dir>/Amore Website Report YYYY-MM.html
// and a PDF next to it (via headless Edge). Default <dir> is Amy's client folder in the vault.
//
// Inquiries = pageviews of /thank-you (the contact form lands there after a successful send).
// Offer claims = pageviews of /offer/<slug>/claimed. Both were wired up 2026-10-19 — earlier months show "—".
import { execSync, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJECT = 'prj_JxAaG1Bo2ojKQN2BcEG8iX05fwyr';
const TEAM = 'team_aXbF2oEtixKoWbt13PY2ABij';
const CONVERSIONS_SINCE = '2026-10'; // first month with /thank-you + /offer/*/claimed tracking
const ANALYTICS_SINCE = '2026-08-11'; // Vercel Web Analytics switched on — August 2026 is a partial month
const REPO = resolve(import.meta.dirname, '..');

const month = process.argv[2];
if (!/^\d{4}-\d{2}$/.test(month || '')) throw new Error('usage: node tools/monthly-report.mjs YYYY-MM [--out <dir>]');
const outIdx = process.argv.indexOf('--out');
const outDir = outIdx > 0 ? process.argv[outIdx + 1] : 'D:\\Winston\\ThomasDavidJacob\\TDJ-Vault\\Agency\\Clients\\Amore Reports';

// ---- Month boundaries at Pacific midnight ----
const pacificMidnight = (y, m) => {
  for (const off of [7, 8]) {
    const d = new Date(Date.UTC(y, m - 1, 1, off));
    const h = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', hourCycle: 'h23' }).format(d);
    if (Number(h) === 0) return d;
  }
  throw new Error('could not resolve Pacific midnight');
};
const span = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  const since = pacificMidnight(y, m);
  const until = m === 12 ? pacificMidnight(y + 1, 1) : pacificMidnight(y, m + 1);
  return { ym, since, until: until > new Date() ? new Date() : until, partial: until > new Date() };
};
const prevYm = (ym) => { const [y, m] = ym.split('-').map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`; };
const label = (ym) => new Date(`${ym}-15T12:00:00Z`).toLocaleString('en-US', { month: 'long', year: 'numeric' });

// ---- Vercel Analytics ----
const query = (s, by, limit = 100) => {
  const url = `/v1/query/web-analytics/visits/aggregate?projectId=${PROJECT}&teamId=${TEAM}&since=${s.since.toISOString()}&until=${s.until.toISOString()}&by=${by}&limit=${limit}`;
  const raw = execSync(`vercel api "${url}" --method GET`, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return JSON.parse(raw.slice(raw.indexOf('{'))).data;
};
const collect = (s) => {
  const totals = query(s, 'month').reduce((a, r) => ({ visitors: a.visitors + r.visitors, pageviews: a.pageviews + r.pageviews }), { visitors: 0, pageviews: 0 });
  const paths = query(s, 'requestPath');
  const norm = (p) => p.replace(/\/$/, '') || '/';
  const inquiries = paths.filter((r) => norm(r.requestPath) === '/thank-you').reduce((n, r) => n + r.pageviews, 0);
  const claims = paths.filter((r) => /^\/offer\/[^/]+\/claimed$/.test(norm(r.requestPath))).reduce((n, r) => n + r.pageviews, 0);
  const tracked = s.ym >= CONVERSIONS_SINCE;
  return {
    ...totals,
    inquiries: tracked ? inquiries : null,
    claims: tracked ? claims : null,
    pages: paths.filter((r) => r.requestPath !== 'Others' && !/^\/(thank-you|offer)/.test(norm(r.requestPath))),
    referrers: query(s, 'referrerHostname', 25),
    devices: query(s, 'deviceType', 10),
  };
};

const cur = span(month), prev = span(prevYm(month));
const now = collect(cur), before = collect(prev);

// ---- Formatting ----
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const num = (n) => (n == null ? '—' : n.toLocaleString('en-US'));
const delta = (a, b) => {
  if (a == null || b == null || b === 0) return '<span class="d d--na">new</span>';
  const pct = Math.round(((a - b) / b) * 100);
  return `<span class="d ${pct >= 0 ? 'd--up' : 'd--down'}">${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct)}%</span>`;
};
const PAGE_NAMES = {
  '/': 'Home', '/services': 'Services & Pricing', '/contact': 'Contact', '/portfolio': 'Portfolio', '/about': 'About',
  '/blog': 'Journal', '/services/holiday-events': 'Holiday Events', '/services/micro-wedding': 'Micro Weddings',
  '/services/pnw-elopement': 'PNW Elopements', '/holiday-events': 'Holiday Events',
};
const SMALL = new Set(['of', 'and', 'the', 'at', 'in', 'a', 'to', 'for', 'vs']);
const titleCase = (slug) => slug.replace(/-\d+$/, '').split('-')
  .map((w, i) => (i && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1))).join(' ');
const pageName = (p) => {
  const n = p.replace(/\/$/, '') || '/';
  if (PAGE_NAMES[n]) return PAGE_NAMES[n];
  const m = n.match(/^\/(blog|portfolio)\/(.+)$/);
  if (m) return `${m[1] === 'blog' ? 'Journal' : 'Portfolio'}: ${titleCase(m[2]).replace(' And ', ' & ')}`;
  return n;
};
const sourceName = (h) => {
  if (!h) return 'Direct, texts & apps';
  if (/(^|\.)google\./.test(h)) return 'Google';
  if (/instagram/.test(h)) return 'Instagram';
  if (/facebook|fb\.com/.test(h)) return 'Facebook';
  if (/bing\./.test(h)) return 'Bing';
  if (/pinterest/.test(h)) return 'Pinterest';
  if (/theknot|weddingwire|zola/.test(h)) return h.replace(/^www\./, '');
  return h.replace(/^www\./, '');
};
const groupSources = (rows) => {
  const g = new Map();
  for (const r of rows) {
    if (r.referrerHostname === 'Others' || /amorecoordination\.com$/.test(r.referrerHostname)) continue;
    const k = sourceName(r.referrerHostname);
    g.set(k, (g.get(k) || 0) + r.visitors);
  }
  return [...g].sort((a, b) => b[1] - a[1]).slice(0, 7);
};
const bar = (v, max) => `<span class="bar"><span style="width:${max ? Math.max(3, Math.round((v / max) * 100)) : 0}%"></span></span>`;
const table = (rows, max) => rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="bar-cell">${bar(v, max)}</td><td class="n">${num(v)}</td></tr>`).join('');

const topPages = now.pages.slice(0, 8).map((r) => [pageName(r.requestPath), r.visitors]);
const sources = groupSources(now.referrers);
const devTotal = now.devices.reduce((n, r) => n + r.visitors, 0);
const devices = now.devices.map((r) => `${titleCase(r.deviceType)} ${devTotal ? Math.round((r.visitors / devTotal) * 100) : 0}%`).join(' · ');
const google = sources.find(([k]) => k === 'Google')?.[1] ?? 0;
const instagram = sources.find(([k]) => k === 'Instagram')?.[1] ?? 0;

const kpi = (labelText, a, b, note = '') => `
  <div class="kpi"><p class="kpi__label">${labelText}</p><p class="kpi__n">${num(a)}</p>
  <p class="kpi__d">${a == null ? '<span class="d d--na">tracking starts Oct 2026</span>' : delta(a, b) + ` <span class="vs">vs ${num(b)}</span>`}</p>${note}</div>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Amore Coordination — Website Report — ${label(month)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  @page { size: letter; margin: 0; }
  :root { --paper:#fbf9f4; --ink:#2b2723; --soft:#5c554d; --line:#e4dcd2; --plum:#6e3d63; --plum-deep:#582f50; --sage:#7e9070; --cream:#efe9df; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--paper); color: var(--ink); font: 300 10.5pt/1.5 "Jost", Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 8.5in; min-height: 11in; padding: 0.6in 0.65in 0.5in; display: flex; flex-direction: column; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid var(--line); padding-bottom: 14px; }
  .brand { font: 600 22pt/1 "Cormorant Garamond", Georgia, serif; color: var(--plum-deep); }
  .brand em { font-weight: 500; color: var(--plum); }
  .eyebrow { font: 500 7.5pt/1 "Jost"; letter-spacing: .22em; text-transform: uppercase; color: var(--sage); }
  h1 { font: 500 26pt/1.1 "Cormorant Garamond", Georgia, serif; margin: 22px 0 4px; }
  .lede { color: var(--soft); max-width: 6.2in; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 22px 0 18px; }
  .kpi { background: #fff; border: 1px solid var(--line); padding: 14px 14px 12px; }
  .kpi__label { font: 500 7.5pt/1.2 "Jost"; letter-spacing: .16em; text-transform: uppercase; color: var(--soft); min-height: 2.4em; }
  .kpi__n { font: 600 28pt/1 "Cormorant Garamond", Georgia, serif; color: var(--plum-deep); margin: 6px 0 4px; }
  .kpi__d { font-size: 8.5pt; }
  .d { font-weight: 500; } .d--up { color: #4f6b45; } .d--down { color: #9a4a4a; } .d--na { color: var(--soft); font-weight: 400; font-style: italic; }
  .vs { color: var(--soft); }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; }
  h2 { font: 500 15pt/1.2 "Cormorant Garamond", Georgia, serif; margin-bottom: 8px; color: var(--plum-deep); }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 5px 0; border-bottom: 1px solid var(--line); font-size: 9.5pt; vertical-align: middle; }
  td.n { text-align: right; font-weight: 400; width: 40px; }
  td.bar-cell { width: 34%; padding: 0 10px; }
  .bar { display: block; height: 6px; background: var(--cream); } .bar span { display: block; height: 100%; background: var(--plum); }
  .meta { margin-top: 10px; font-size: 9pt; color: var(--soft); }
  .notes { margin-top: 22px; background: var(--cream); padding: 14px 18px; }
  .notes ul { margin-left: 16px; } .notes li { margin: 3px 0; }
  footer { margin-top: auto; padding-top: 16px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; font-size: 8pt; color: var(--soft); }
</style></head>
<body><div class="page">
  <header>
    <div><p class="eyebrow">Monthly Website Report</p><p class="brand">Amore <em>Coordination</em></p></div>
    <p class="eyebrow">${esc(label(month))}${cur.partial ? ' · month to date' : ''}</p>
  </header>

  <h1>${esc(label(month))} at a glance</h1>
  <p class="lede">How couples found and used amorecoordination.com this month, compared with ${esc(label(prev.ym))}.</p>

  <section class="kpis">
    ${kpi('Visitors', now.visitors, before.visitors)}
    ${kpi('Page views', now.pageviews, before.pageviews)}
    ${kpi('Inquiries sent', now.inquiries, before.inquiries)}
    ${kpi('From Google', google, groupSources(before.referrers).find(([k]) => k === 'Google')?.[1] ?? 0)}
  </section>

  <section class="grid">
    <div><h2>Most-visited pages</h2><table>${table(topPages, topPages[0]?.[1])}</table></div>
    <div><h2>Where visitors came from</h2><table>${table(sources, sources[0]?.[1])}</table>
      <p class="meta">Devices: ${esc(devices)}</p></div>
  </section>

  <section class="notes">
    <p class="eyebrow" style="margin-bottom:6px">Highlights</p>
    <ul>
      <li>${num(now.visitors)} visitors viewed ${num(now.pageviews)} pages${before.visitors ? ` (${before.visitors <= now.visitors ? 'up' : 'down'} from ${num(before.visitors)} visitors in ${esc(label(prev.ym).split(' ')[0])})` : ''}.</li>
      <li>${now.inquiries == null ? 'Inquiry tracking begins October 2026.' : `${num(now.inquiries)} contact-form ${now.inquiries === 1 ? 'inquiry' : 'inquiries'} sent through the site.`}</li>
      ${now.claims ? `<li>${num(now.claims)} event guest ${now.claims === 1 ? 'offer' : 'offers'} claimed from QR cards.</li>` : ''}
      <li>Google sent ${num(google)} ${google === 1 ? 'visitor' : 'visitors'}; Instagram sent ${num(instagram)}.</li>
      ${prev.ym === ANALYTICS_SINCE.slice(0, 7) ? `<li>Note: tracking began ${esc(new Date(ANALYTICS_SINCE + 'T12:00:00Z').toLocaleString('en-US', { month: 'long', day: 'numeric' }))}, so ${esc(label(prev.ym).split(' ')[0])} figures cover only part of the month.</li>` : ''}
    </ul>
  </section>

  <footer><span>Prepared by Thomas+David+Jacob</span><span>Source: Vercel Web Analytics · privacy-friendly, no cookies</span></footer>
</div></body></html>`;

mkdirSync(outDir, { recursive: true });
const base = join(outDir, `Amore Website Report ${month}`);
writeFileSync(`${base}.html`, html);

const edge = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find(existsSync);
if (edge) {
  execFileSync(edge, ['--headless=new', '--no-pdf-header-footer', `--print-to-pdf=${base}.pdf`, '--virtual-time-budget=4000', pathToFileURL(`${base}.html`).href], { stdio: 'ignore' });
}
console.log(JSON.stringify({ month, visitors: now.visitors, pageviews: now.pageviews, inquiries: now.inquiries, claims: now.claims, google, html: `${base}.html`, pdf: edge ? `${base}.pdf` : null }, null, 2));
