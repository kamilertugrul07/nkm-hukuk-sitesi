import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Petition samples. The body is the petition text itself; [KÖŞELİ PARANTEZ] marks a blank to fill in.
// scripts/build-docs.mjs reads the same files to produce the Word and PDF downloads.
const dilekceler = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/dilekceler' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(['İcra ve İflas', 'Aile', 'Ceza', 'İş', 'Gayrimenkul ve Tapu', 'Yabancılar', 'Kat Mülkiyeti ve Site Yönetimi', 'İdare', 'Trafik ve İdari Para Cezaları']),
    summary: z.string(),
    deadline: z.object({
      label: z.string(),
      detail: z.string(),
    }),
    authority: z.string(),
    law: z.string(),
    steps: z.array(z.string()).min(1),
    updated: z.coerce.date(),
    order: z.number().default(100),
  }),
});

// Power of attorney samples, built the same way as petitions (downloads from the same Markdown).
const vekaletler = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/vekaletler' }),
  schema: z.object({
    title: z.string(),
    kind: z.string(),
    summary: z.string(),
    where: z.string(),
    documents: z.array(z.string()).min(1),
    note: z.string().optional(),
    steps: z.array(z.string()).min(1),
    updated: z.coerce.date(),
    order: z.number().default(100),
  }),
});

// Articles. The cover is a project image; related points to petition slugs shown at the end.
const makaleler = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/makaleler' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    area: z.enum(['İcra ve İflas', 'Aile', 'Ceza', 'İş', 'Gayrimenkul ve Tapu', 'Yabancılar', 'Kat Mülkiyeti ve Site Yönetimi', 'Trafik Kazası ve Sigorta']),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    author: z.string().default('NKM Hukuk Bürosu'),
    cover: image(),
    coverAlt: z.string(),
    related: z.array(z.string()).default([]),
  }),
});

// Practice areas. The body is the introduction; services and FAQs are structured for the page and search engines.
const alanlar = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/alanlar' }),
  schema: ({ image }) => z.object({
    name: z.string(),
    summary: z.string(),
    image: image(),
    imageAlt: z.string(),
    order: z.number(),
    services: z.array(z.object({ title: z.string(), text: z.string() })).min(3),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  }),
});

// Legal pages (KVKK notice, legal disclaimer).
const yasal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/yasal' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updated: z.coerce.date(),
  }),
});

export const collections = { dilekceler, vekaletler, makaleler, alanlar, yasal };
