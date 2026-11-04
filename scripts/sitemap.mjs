// After `astro build`: lists every built page in dist/sitemap.xml (404 excluded).
import { readdir, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const SITE = 'https://nkmhukuk.com';
const DIST = 'dist';
const pages = [];

async function walk(dir) {
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) { if (name !== '_astro' && name !== 'indir') await walk(p); }
    else if (name === 'index.html') pages.push({ path: '/' + relative(DIST, dir).split('\\').join('/'), mtime: s.mtime });
  }
}
await walk(DIST);

const urls = pages
  .map(({ path, mtime }) => ({ loc: SITE + (path === '/' ? '/' : path + '/'), lastmod: mtime.toISOString().slice(0, 10) }))
  .sort((a, b) => a.loc.localeCompare(b.loc))
  .map((u) => `  <url><loc>${encodeURI(u.loc)}</loc><lastmod>${u.lastmod}</lastmod></url>`);

await writeFile(join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
console.log(`sitemap.xml: ${urls.length} sayfa`);
