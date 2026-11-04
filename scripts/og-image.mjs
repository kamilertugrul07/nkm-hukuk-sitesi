// One-off: builds public/og.jpg (1200×630 social preview) from the hero photo and the firm logo.
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const W = 1200, H = 630;
const logo = (await readFile('src/assets/logo/nkm-logo.svg', 'utf8')).replace('fill="currentColor"', 'fill="#FBF8F3"');
const logoPng = await sharp(Buffer.from(logo)).resize({ width: 520 }).png().toBuffer();
const shade = Buffer.from(`<svg width="${W}" height="${H}"><rect width="100%" height="100%" fill="#1F1A17" fill-opacity=".62"/></svg>`);

await sharp('src/assets/img/hero-masa.png')
  .resize(W, H, { fit: 'cover' })
  .composite([{ input: shade }, { input: logoPng, gravity: 'center' }])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile('public/og.jpg');
console.log('public/og.jpg yazıldı');
