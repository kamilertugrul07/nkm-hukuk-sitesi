// Shared text blocks for sample documents. A line of the form {{name}} in a document body is replaced
// with src/content/parcalar/name.md, so one clause list can serve several documents.
// Used by both the pages (DocumentPage.astro) and the downloads (scripts/build-docs.mjs).
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'src/content/parcalar');

export function expandParts(body) {
  return body.replace(/^\{\{([a-z0-9-]+)\}\}$/gm, (_, name) => {
    const file = path.join(DIR, `${name}.md`);
    if (!fs.existsSync(file)) throw new Error(`Ortak metin bulunamadı: src/content/parcalar/${name}.md`);
    return fs.readFileSync(file, 'utf8').trim();
  });
}
