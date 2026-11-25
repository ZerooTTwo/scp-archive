import { readCatalog, writeCatalog } from './db';
import { SERIES } from './constants';
import type { Branch, Catalog, Entry, SeriesDef } from './types';

let memo: Catalog | null = null;
let loading: Promise<Catalog> | null = null;

async function fetchSeed(): Promise<Catalog> {
  const response = await fetch(`${import.meta.env.BASE_URL}seed/catalog.json`, {
    cache: 'no-cache',
  });
  if (!response.ok) throw new Error(`无法读取内置目录 (${response.status})`);
  const data = (await response.json()) as Catalog;
  if (!Array.isArray(data.entries)) throw new Error('内置目录格式无效');
  return data;
}

/**
 * Loads the catalog from IndexedDB, falling back to the bundled snapshot on
 * first launch. The snapshot is written back so later launches are instant.
 */
export async function ensureCatalog(): Promise<Catalog> {
  if (memo) return memo;
  if (loading) return loading;
  loading = (async () => {
    const stored = await readCatalog();
    const knownSeries = new Set(stored?.entries?.map((entry) => entry.seriesId));
    const complete = SERIES.every((series) => knownSeries.has(series.id));
    if (stored?.entries?.length && complete) {
      memo = stored;
      return stored;
    }
    const seed = await fetchSeed();
    seed.generatedAt = seed.generatedAt || Date.now();
    await writeCatalog(seed);
    memo = seed;
    return seed;
  })();
  try {
    return await loading;
  } finally {
    loading = null;
  }
}

export function peekCatalog(): Catalog | null {
  return memo;
}

export async function saveCatalog(catalog: Catalog): Promise<void> {
  memo = catalog;
  await writeCatalog(catalog);
}

export function entryKey(entry: Pick<Entry, 'branch' | 'slug'>): string {
  return `${entry.branch}:${entry.slug}`;
}

export function seriesCounts(entries: Entry[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const series of SERIES) counts[series.id] = 0;
  for (const entry of entries) {
    counts[entry.seriesId] = (counts[entry.seriesId] ?? 0) + 1;
  }
  return counts;
}

export function seriesOfEntry(entry: Entry): SeriesDef | undefined {
  return SERIES.find((series) => series.id === entry.seriesId);
}

export function findEntry(entries: Entry[], branch: Branch, slug: string): Entry | undefined {
  return entries.find((entry) => entry.branch === branch && entry.slug === slug);
}

export function randomEntry(entries: Entry[]): Entry | undefined {
  if (!entries.length) return undefined;
  return entries[Math.floor(Math.random() * entries.length)];
}

export function sortEntries(entries: Entry[]): Entry[] {
  const order = new Map(SERIES.map((series, index) => [series.id, index]));
  return [...entries].sort((a, b) => {
    const seriesA = order.get(a.seriesId) ?? 999;
    const seriesB = order.get(b.seriesId) ?? 999;
    if (seriesA !== seriesB) return seriesA - seriesB;
    if (a.position !== b.position) return a.position - b.position;
    return a.code.localeCompare(b.code);
  });
}
