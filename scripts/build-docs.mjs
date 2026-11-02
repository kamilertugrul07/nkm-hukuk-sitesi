// Builds the Word (.docx) and PDF downloads for every sample document (petitions, powers of attorney).
// The page, the .docx and the .pdf all come from the same Markdown file, so they never drift apart.
//
// Markdown conventions in a petition body:
//   # ...        addressee line (centred, bold)
//   ## ...       section heading (AÇIKLAMALAR, SONUÇ VE İSTEM ...)
//   1. ...       numbered paragraph
//   > ...        signature block (right side), one line per paragraph
//   [ ... ]      a blank the reader fills in (highlighted)
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import * as docx from 'docx';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { expandParts } from '../src/lib/parcalar.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
// Content folder → download folder under public/indir.
const SETS = [
  { src: 'src/content/dilekceler', out: 'public/indir/dilekce', name: 'dilekçe' },
  { src: 'src/content/vekaletler', out: 'public/indir/vekalet', name: 'vekaletname' },
];
const FOOTER = 'Örnek metindir; kendi durumunuza göre düzenleyin. Kaynak: NKM Hukuk Bürosu, nkmhukuk.com';

// ---------- Markdown → blocks of styled runs ----------

/** Split plain text into runs, marking [ ... ] blanks. */
function textRuns(text, bold = false) {
  return text.split(/(\[[^\]]*\])/).filter(Boolean)
    .map((t) => ({ text: t, bold, blank: /^\[.*\]$/.test(t) }));
}

function inlineRuns(tokens, bold = false) {
  const runs = [];
  for (const t of tokens ?? []) {
    if (t.type === 'strong') runs.push(...inlineRuns(t.tokens, true));
    else if (t.tokens) runs.push(...inlineRuns(t.tokens, bold));
    else runs.push(...textRuns(t.text ?? t.raw ?? '', bold));
  }
  return runs;
}

function toBlocks(body) {
  const blocks = [];
  for (const tok of marked.lexer(body)) {
    if (tok.type === 'heading') blocks.push({ type: tok.depth === 1 ? 'title' : 'heading', runs: inlineRuns(tok.tokens, true) });
    else if (tok.type === 'paragraph') blocks.push({ type: 'para', runs: inlineRuns(tok.tokens) });
    else if (tok.type === 'list') {
      tok.items.forEach((item, i) => {
        const inner = item.tokens.flatMap((t) => (t.type === 'paragraph' || t.type === 'text' ? [t] : []));
        blocks.push({ type: 'item', n: (tok.start || 1) + i, runs: inner.flatMap((t) => inlineRuns(t.tokens ?? [t])) });
      });
    } else if (tok.type === 'blockquote') {
      blocks.push({ type: 'sign', lines: tok.tokens.filter((t) => t.type === 'paragraph').map((t) => inlineRuns(t.tokens)) });
    }
  }
  return blocks;
}

// The closing part that must stay on the same page as the signature: the last section when it is
// short (a petition's SONUÇ VE İSTEM), otherwise only the paragraph right before the signature.
function tailStart(blocks) {
  const sign = blocks.findLastIndex((b) => b.type === 'sign');
  const head = blocks.findLastIndex((b) => b.type === 'heading');
  return sign - head <= 3 ? head : Math.max(sign - 1, 0);
}

// ---------- Word ----------

function docxRuns(runs) {
  return runs.map((r) => new docx.TextRun({
    text: r.text, bold: r.bold, highlight: r.blank ? 'yellow' : undefined,
  }));
}

async function buildDocx(blocks, title) {
  const P = docx.Paragraph;
  const children = [];
  const tail = tailStart(blocks);
  for (const [i, b] of blocks.entries()) {
    // Everything from the last section heading on stays with the signature.
    const keep = i >= tail ? { keepNext: true, keepLines: true } : {};
    if (b.type === 'title') children.push(new P({ alignment: docx.AlignmentType.CENTER, spacing: { after: 480 }, children: docxRuns(b.runs) }));
    else if (b.type === 'heading') children.push(new P({ ...keep, spacing: { before: 240, after: 120 }, children: docxRuns(b.runs) }));
    else if (b.type === 'para') children.push(new P({ ...keep, alignment: docx.AlignmentType.JUSTIFIED, spacing: { after: 160 }, children: docxRuns(b.runs) }));
    else if (b.type === 'item') children.push(new P({
      alignment: docx.AlignmentType.JUSTIFIED, spacing: { after: 160 }, indent: { firstLine: 567 },
      children: [new docx.TextRun({ text: `${b.n}. ` }), ...docxRuns(b.runs)],
    }));
    else if (b.type === 'sign') {
      children.push(new P({ ...keep, spacing: { before: 480 }, children: [] }));
      b.lines.forEach((line, j) => children.push(new P({
        ...(j < b.lines.length - 1 ? keep : {}), alignment: docx.AlignmentType.CENTER, indent: { left: 5400 }, children: docxRuns(line),
      })));
    }
  }
  const doc = new docx.Document({
    title, creator: 'NKM Hukuk Bürosu',
    styles: { default: { document: { run: { font: 'Times New Roman', size: 24 }, paragraph: { spacing: { line: 360 } } } } },
    sections: [{
      properties: { page: { margin: { top: 1418, bottom: 1418, left: 1418, right: 1418 } } },
      footers: { default: new docx.Footer({ children: [new P({ alignment: docx.AlignmentType.CENTER, children: [new docx.TextRun({ text: FOOTER, size: 16, color: '7A7068' })] })] }) },
      children,
    }],
  });
  return docx.Packer.toBuffer(doc);
}

// ---------- PDF ----------

const A4 = [595.28, 841.89];
const M = 70;             // page margin, pt
const SIZE = 12;
const LEAD = 18;          // 1.5 line spacing
const HIGHLIGHT = rgb(1, 0.94, 0.55);
const INK = rgb(0.12, 0.1, 0.09);

async function buildPdf(blocks, title) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(title);
  pdf.setAuthor('NKM Hukuk Bürosu');
  const fontDir = path.join(ROOT, 'scripts/fonts');
  const regular = await pdf.embedFont(fs.readFileSync(path.join(fontDir, 'Tinos-Regular.ttf')), { subset: true });
  const bold = await pdf.embedFont(fs.readFileSync(path.join(fontDir, 'Tinos-Bold.ttf')), { subset: true });
  const fontOf = (r) => (r.bold ? bold : regular);
  const width = A4[0] - 2 * M;

  let page, y;
  const newPage = () => {
    page = pdf.addPage(A4);
    y = A4[1] - M;
    const fw = regular.widthOfTextAtSize(FOOTER, 8);
    page.drawText(FOOTER, { x: (A4[0] - fw) / 2, y: 36, size: 8, font: regular, color: rgb(0.48, 0.44, 0.41) });
  };
  const ensure = (h) => { if (y - h < M) newPage(); };

  // Break runs into words that keep their style, then lay them into lines.
  const words = (runs) => runs.flatMap((r) => r.text.split(/(\s+)/).filter((w) => w !== '').map((w) => ({ ...r, text: w })));
  const layout = (runs, maxW, indent = 0) => {
    const lines = [[]];
    let w = indent;
    for (const word of words(runs)) {
      const ww = fontOf(word).widthOfTextAtSize(word.text, SIZE);
      const isSpace = /^\s+$/.test(word.text);
      if (!isSpace && w + ww > maxW && lines.at(-1).length) { lines.push([]); w = 0; }
      if (isSpace && lines.at(-1).length === 0) continue;
      lines.at(-1).push({ ...word, w: ww });
      w += ww;
    }
    return lines.map((l) => { while (l.length && /^\s+$/.test(l.at(-1).text)) l.pop(); return l; });
  };
  const drawLine = (line, x0, { justify = false, maxW = width } = {}) => {
    const total = line.reduce((s, p) => s + p.w, 0);
    const gaps = line.filter((p) => /^\s+$/.test(p.text)).length;
    const extra = justify && gaps ? (maxW - (x0 - M) - total) / gaps : 0;
    let x = x0;
    for (const p of line) {
      const space = /^\s+$/.test(p.text);
      if (p.blank) page.drawRectangle({ x: x - 1, y: y - 4, width: p.w + 2, height: SIZE + 4, color: HIGHLIGHT });
      if (!space) page.drawText(p.text, { x, y, size: SIZE, font: fontOf(p), color: INK });
      x += p.w + (space ? extra : 0);
    }
  };
  const paragraph = (runs, { indent = 0, after = 8, align = 'justify' } = {}) => {
    const lines = layout(runs, width, indent);
    lines.forEach((line, i) => {
      ensure(LEAD);
      y -= LEAD;
      const lw = line.reduce((s, p) => s + p.w, 0);
      const x = align === 'center' ? M + (width - lw) / 2 : M + (i === 0 ? indent : 0);
      drawLine(line, x, { justify: align === 'justify' && i < lines.length - 1 });
    });
    y -= after;
  };

  const SIGN_W = 200;
  const heightOf = (b) => {
    if (b.type === 'heading') return 14 + layout(b.runs, width).length * LEAD;
    if (b.type === 'para') return 8 + layout(b.runs, width).length * LEAD;
    if (b.type === 'item') return 8 + layout(b.runs, width, 28).length * LEAD;
    if (b.type === 'sign') return 24 + b.lines.reduce((h, l) => h + layout(l, SIGN_W).length * LEAD, 0);
    return 0;
  };
  const tail = tailStart(blocks);
  const tailHeight = blocks.slice(tail).reduce((h, b) => h + heightOf(b), 0);

  newPage();
  for (const [i, b] of blocks.entries()) {
    // The closing section moves to a new page whole rather than leaving the signature alone.
    if (i === tail && y - tailHeight < M && tailHeight < A4[1] - 2 * M) newPage();
    if (b.type === 'title') { paragraph(b.runs, { align: 'center', after: 28 }); }
    else if (b.type === 'heading') { y -= 10; paragraph(b.runs, { align: 'left', after: 4 }); }
    else if (b.type === 'para') paragraph(b.runs);
    else if (b.type === 'item') paragraph([{ text: `${b.n}. `, bold: false }, ...b.runs], { indent: 28 });
    else if (b.type === 'sign') {
      y -= 24;
      const boxX = A4[0] - M - SIGN_W;
      for (const runs of b.lines) {
        for (const line of layout(runs, SIGN_W)) {
          ensure(LEAD);
          const lw = line.reduce((sum, p) => sum + p.w, 0);
          y -= LEAD;
          drawLine(line, boxX + (SIGN_W - lw) / 2);
        }
      }
    }
  }
  return pdf.save();
}

// ---------- Run ----------

for (const set of SETS) {
  const src = path.join(ROOT, set.src);
  const out = path.join(ROOT, set.out);
  if (!fs.existsSync(src)) continue;
  fs.mkdirSync(out, { recursive: true });
  const files = fs.readdirSync(src).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    let parsed;
    try {
      parsed = matter(fs.readFileSync(path.join(src, file), 'utf8'));
    } catch (err) {
      throw new Error(`build-docs: ${file} başlık bilgilerinde (frontmatter) hata var: ${err.reason ?? err.message}`);
    }
    const { data, content } = parsed;
    const blocks = toBlocks(expandParts(content));
    fs.writeFileSync(path.join(out, `${slug}.docx`), await buildDocx(blocks, data.title));
    fs.writeFileSync(path.join(out, `${slug}.pdf`), await buildPdf(blocks, data.title));
  }
  console.log(`build-docs: ${files.length} ${set.name} → ${set.out} (.docx + .pdf)`);
}
