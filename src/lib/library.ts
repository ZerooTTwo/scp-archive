import { OFFLINE_LIMIT } from './constants';
import {
  readOffline,
  readProgress,
  removeArticle,
  removeProgress,
  writeArticle,
  writeOffline,
  writeProgress,
} from './db';
import type { Article, OfflineRecord, ProgressRecord } from './types';

let queue: Promise<unknown> = Promise.resolve();

function serial<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.catch(() => undefined);
  return next;
}

export function articleBytes(article: Article): number {
  return new Blob([article.html]).size;
}

export function offlineRecordFor(article: Article): OfflineRecord {
  return {
    branch: article.branch,
    slug: article.slug,
    code: article.code,
    title: article.title,
    bytes: articleBytes(article),
    at: Date.now(),
  };
}

/** Writes an article body and keeps the offline index + eviction policy in sync. */
export function cacheArticle(article: Article): Promise<void> {
  return serial(async () => {
    await writeArticle(article);
    const list = await readOffline();
    const record = offlineRecordFor(article);
    const next = [record, ...list.filter((item) => `${item.branch}:${item.slug}` !== `${article.branch}:${article.slug}`)];
    while (next.length > OFFLINE_LIMIT) {
      const evicted = next.pop();
      if (!evicted) break;
      await removeArticle(evicted.branch, evicted.slug);
    }
    await writeOffline(next);
  });
}

export function removeOffline(branch: string, slug: string): Promise<void> {
  return serial(async () => {
    await removeArticle(branch, slug);
    const list = await readOffline();
    await writeOffline(list.filter((item) => !(item.branch === branch && item.slug === slug)));
  });
}

export function clearOffline(): Promise<void> {
  return serial(async () => {
    const list = await readOffline();
    for (const item of list) await removeArticle(item.branch, item.slug);
    await writeOffline([]);
  });
}

export async function saveReadingProgress(record: ProgressRecord): Promise<void> {
  await writeProgress(record);
}

export async function getReadingProgress(
  branch: string,
  slug: string,
): Promise<ProgressRecord | undefined> {
  return readProgress(branch, slug);
}

export async function forgetReadingProgress(branch: string, slug: string): Promise<void> {
  await removeProgress(branch, slug);
}
