// Business-card print pages (85×55 mm trim + 3 mm bleed), a foil separation layer, and logo PDF/PNG pages.
import fs from 'node:fs';

const DIR = process.argv[2];
const svg = n => fs.readFileSync(`${DIR}/svg/${n}.svg`, 'utf8');
const fonts = `
@font-face{font-family:Cormorant;src:url(../../fonts/CormorantGaramond.ttf)}
@font-face{font-family:Jost;src:url(../../fonts/Jost.ttf)}`;

// slug, name, then the contact lines printed on the back of the card.
const ADDRESS = ['Saray Mah. Yunus Emre Cad. Neslihan Apt.', 'No: 21 Daire: 2, 07400 Alanya / Antalya'];
const LAWYERS = [
  ['niyazi', 'Av. Niyazi Kağan Mısırlıoğlu', ['+90 535 056 77 89', 'bilgi@nkmhukuk.com', ...ADDRESS]],
  ['kamil', 'Av. Kamil Ertuğrul Mısırlıoğlu', ['+90 543 240 60 06', 'bilgi@nkmhukuk.com', ...ADDRESS]],
];

const page = (body, w = '91mm', h = '61mm') => `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
@page{size:${w} ${h};margin:0}*{box-sizing:border-box}html,body{margin:0}
.pg{width:${w};height:${h};position:relative;overflow:hidden;page-break-after:always}
</style></head><body>${body}</body></html>`;

// Front: full-bleed burgundy, foil logo centred on the trim box.
const front = (logo = 'nkm-logo-altin', bg = '#590907') =>
  `<div class="pg" style="background:${bg};display:grid;place-items:center"><div style="width:42mm">${svg(logo)}</div></div>`;
// Back: cream, monogram top-left, details bottom-left; all text ≥3 mm inside trim (6 mm from bleed edge).
const back = (name, contact) => `<div class="pg" style="background:#F3EBDD;color:#1F1A17">
  <div style="position:absolute;left:9mm;top:9mm;width:15mm">${svg('nkm-monogram-bordo')}</div>
  <div style="position:absolute;left:9mm;bottom:8.5mm;font:300 6.6pt/1.6 Jost;letter-spacing:.02em">
    <div style="font:500 11pt/1.1 Cormorant;color:#590907;letter-spacing:.01em">${name}</div>
    <div style="font:400 5.8pt Jost;letter-spacing:.32em;color:#8a7a68;margin:1.2mm 0 2.6mm">AVUKAT</div>
    ${contact.join('<br>')}
  </div></div>`;

fs.mkdirSync(`${DIR}/html`, { recursive: true });
for (const [slug, name, contact] of LAWYERS)
  fs.writeFileSync(`${DIR}/html/kartvizit-${slug}.html`, page(front() + back(name, contact)));
// Foil separation: logo as solid 100% black on white, same position as the front.
fs.writeFileSync(`${DIR}/html/kartvizit-varak-katmani.html`, page(front('nkm-logo-siyah', '#fff')));
// Vector logo PDF on an A5 sheet, bordo on white and gold on burgundy.
fs.writeFileSync(`${DIR}/html/logo.html`, page(
  `<div class="pg" style="display:grid;place-items:center"><div style="width:100mm">${svg('nkm-logo-bordo')}</div></div>` +
  `<div class="pg" style="background:#590907;display:grid;place-items:center"><div style="width:100mm">${svg('nkm-logo-altin')}</div></div>`,
  '148mm', '210mm'));
// Raster sources (screenshot targets): favicon and logo PNGs.
const raster = (name, px, bg = 'transparent') =>
  fs.writeFileSync(`${DIR}/html/png-${name}.html`,
    `<html><body style="margin:0;background:${bg}"><div style="width:${px}px">${svg(name)}</div></body></html>`);
for (const n of ['nkm-logo-bordo', 'nkm-logo-krem', 'nkm-logo-altin', 'nkm-logo-yatay-bordo', 'nkm-monogram-bordo']) raster(n, 2000);
raster('favicon', 512);
console.log('ok');
