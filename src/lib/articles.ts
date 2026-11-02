import { getCollection } from 'astro:content';

/** Articles, newest first. */
export async function getArticles() {
  return (await getCollection('makaleler')).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Reading time at about 200 words a minute, never less than one. */
export function readingMinutes(body: string) {
  return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));
}

export function formatDate(d: Date) {
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}
