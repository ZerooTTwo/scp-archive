import { createStore, del, get, keys, set, clear } from 'idb-keyval';
import type {
  Article,
  Catalog,
  FavoriteRecord,
  OfflineRecord,
  ProgressRecord,
  Settings,
  SyncState,
} from './types';

/**
 * One IndexedDB store holds everything. Article bodies are keyed individually so
 * a catalog refresh never rewrites the (much larger) offline library.
 */
export const store = createStore('scp-archive', 'kv');

const KEY = {
  catalog: 'catalog:v1',
  sync: 'sync:v1',
  settings: 'settings:v1',
  favorites: 'favorites:v1',
  history: 'history:v1',
  offline: 'offline:v1',
  article: (branch: string, slug: string) => `article:v1:${branch}:${slug}`,
  progress: (branch: string, slug: string) => `progress:v1:${branch}:${slug}`,
  articlePrefix: 'article:v1:',
} as const;

export async function readCatalog(): Promise<Catalog | undefined> {
  return get<Catalog>(KEY.catalog, store);
}

export async function writeCatalog(catalog: Catalog): Promise<void> {
  await set(KEY.catalog, catalog, store);
}

export async function readSync(): Promise<SyncState | undefined> {
  return get<SyncState>(KEY.sync, store);
}

export async function writeSync(state: SyncState): Promise<void> {
  await set(KEY.sync, state, store);
}

export async function readSettings(): Promise<Settings | undefined> {
  return get<Settings>(KEY.settings, store);
}

export async function writeSettings(settings: Settings): Promise<void> {
  await set(KEY.settings, settings, store);
}

export async function readFavorites(): Promise<FavoriteRecord[]> {
  return (await get<FavoriteRecord[]>(KEY.favorites, store)) ?? [];
}

export async function writeFavorites(favorites: FavoriteRecord[]): Promise<void> {
  await set(KEY.favorites, favorites, store);
}

export async function readHistory(): Promise<ProgressRecord[]> {
  return (await get<ProgressRecord[]>(KEY.history, store)) ?? [];
}

export async function writeHistory(history: ProgressRecord[]): Promise<void> {
  await set(KEY.history, history, store);
}

export async function readOffline(): Promise<OfflineRecord[]> {
  return (await get<OfflineRecord[]>(KEY.offline, store)) ?? [];
}

export async function writeOffline(items: OfflineRecord[]): Promise<void> {
  await set(KEY.offline, items, store);
}

export async function readArticle(branch: string, slug: string): Promise<Article | undefined> {
  return get<Article>(KEY.article(branch, slug), store);
}

export async function writeArticle(article: Article): Promise<void> {
  await set(KEY.article(article.branch, article.slug), article, store);
}

export async function removeArticle(branch: string, slug: string): Promise<void> {
  await del(KEY.article(branch, slug), store);
}

export async function readProgress(
  branch: string,
  slug: string,
): Promise<ProgressRecord | undefined> {
  return get<ProgressRecord>(KEY.progress(branch, slug), store);
}

export async function writeProgress(record: ProgressRecord): Promise<void> {
  await set(KEY.progress(record.branch, record.slug), record, store);
}

export async function removeProgress(branch: string, slug: string): Promise<void> {
  await del(KEY.progress(branch, slug), store);
}

export async function listArticleKeys(): Promise<string[]> {
  const all = await keys(store);
  return all.filter(
    (key): key is string => typeof key === 'string' && key.startsWith(KEY.articlePrefix),
  );
}

export async function clearAll(): Promise<void> {
  await clear(store);
}

export { KEY as DB_KEYS };
