// Final NKM identity (concept C · Didone): print-safe vector logo set, favicon sources, card print sheets.
import opentype from 'opentype.js';
import fs from 'node:fs';

const font = n => opentype.loadSync(new URL(`./fonts/${n}.ttf`, import.meta.url).pathname);
const bodoni = font('BodoniModa');

function text(str, size, tracking = 0, x = 0, y = 0) {
  const scale = size / bodoni.unitsPerEm;
  let cx = x, d = '', prev = null;
  for (const ch of str) {
    const g = bodoni.charToGlyph(ch);
    if (prev) cx += bodoni.getKerningValue(prev, g) * scale;
    d += g.getPath(cx, y, size).toPathData(2);
    cx += g.advanceWidth * scale + tracking * size;
    prev = g;
  }
  return { d, w: cx - x - tracking * size };
}
const at = (str, size, tracking, x, y) => text(str, size, tracking, x, y);
const centered = (str, size, tracking, cx, y) => at(str, size, tracking, cx - text(str, size, tracking).w / 2, y);

const COLORS = { bordo: '#590907', krem: '#E8D2B5', siyah: '#1F1A17', beyaz: '#FFFFFF' };
// Gold spans the whole lockup in user space, so it reads as one foil sheet.
const GOLD = vb => { const [x, y, w, h] = vb.split(' ').map(Number);
  return `<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}">` +
  [['0', '#8a6a2f'], ['.28', '#e9cf8f'], ['.46', '#b88d45'], ['.62', '#f6e2ad'], ['.82', '#9c7838'], ['1', '#d9b874']]
    .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('') + '</linearGradient></defs>'; };

const svg = (vb, body, fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${fill === 'altin' ? '' : ` fill="${COLORS[fill]}"`}>` +
  (fill === 'altin' ? `${GOLD(vb)}<g fill="url(#g)">${body}</g>` : body) + '</svg>';
const p = d => `<path d="${d}"/>`;
// Rules are filled rectangles, not strokes, so they survive foil/outline workflows unchanged.
const rule = (cx, y, half, h) => `<rect x="${cx - half}" y="${y - h / 2}" width="${half * 2}" height="${h}"/>`;

// Vertical primary: NKM / rule / HUKUK BÜROSU. Hairline rule 3u ≈ 0.22mm at 44mm card width.
const cx = 300;
const nkm = centered('NKM', 132, 0.06, cx, 150);
const sub = centered('HUKUK BÜROSU', 22, 0.36, cx, 218);
const vBody = p(nkm.d) + rule(cx, 181, 26, 3) + p(sub.d);
const vBox = `${cx - nkm.w / 2 - 6} 48 ${nkm.w + 12} 180`;

// Horizontal (site header): NKM | HUKUK BÜROSU.
const hN = at('NKM', 100, 0.04, 0, 100);
const hS = at('HUKUK BÜROSU', 24, 0.36, hN.w + 58, 76);
const hBody = p(hN.d) + `<rect x="${hN.w + 28}" y="22" width="2.5" height="82"/>` + p(hS.d);
const hBox = `-4 18 ${hN.w + 58 + hS.w + 8} 90`;

// Monogram only.
const mBox = `${cx - nkm.w / 2 - 6} 48 ${nkm.w + 12} 108`;

const OUT = process.argv[2];
fs.mkdirSync(`${OUT}/svg`, { recursive: true });
const files = {};
for (const c of ['bordo', 'krem', 'siyah', 'beyaz', 'altin']) {
  files[`nkm-logo-${c}`] = svg(vBox, vBody, c);
  files[`nkm-monogram-${c}`] = svg(mBox, p(nkm.d), c);
}
for (const c of ['bordo', 'krem', 'siyah', 'beyaz']) files[`nkm-logo-yatay-${c}`] = svg(hBox, hBody, c);

// Favicon: cream monogram on a burgundy square; tighter tracking so it reads at 16px.
const fN = centered('NKM', 132, 0.0, 300, 150);
const fPad = 34, fSide = fN.w + fPad * 2, fTop = 150 - 95 - (fSide - 95) / 2;
files['favicon'] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${300 - fSide / 2} ${fTop} ${fSide} ${fSide}">` +
  `<rect x="${300 - fSide / 2}" y="${fTop}" width="${fSide}" height="${fSide}" fill="${COLORS.bordo}"/>` +
  `<path fill="${COLORS.krem}" d="${fN.d}"/></svg>`;

for (const [k, v] of Object.entries(files)) fs.writeFileSync(`${OUT}/svg/${k}.svg`, v);
console.log(Object.keys(files).length, 'svg');
