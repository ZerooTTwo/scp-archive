import { SERIES } from './constants';
import { entryKey } from './catalog';
import type { Catalog, Entry, SyncState } from './types';
import { fetchSeries, isOnline } from './wiki';

export interface SyncProgress {
  done: number;
  total: number;
  label: string;
}

export interface SyncResult {
  catalog: Catalog;
  added: number;
  errors: string[];
}

/**
 * Refreshes every series page and merges the result into the existing catalog.
 * A series that fails keeps its previous entries, so a flaky network can never
 * wipe the local index.
 */
export async function performSync(
  existing: Catalog,
  onProgress?: (progress: SyncProgress) => void,
): Promise<SyncResult> {
  if (!isOnline()) throw new Error('当前处于离线状态');

  const oldByKey = new Map(existing.entries.map((entry) => [entryKey(entry), entry]));
  const nextByKey = new Map<string, Entry>();
  const errors: string[] = [];
  let added = 0;

  for (let index = 0; index < SERIES.length; index += 1) {
    const series = SERIES[index];
    onProgress?.({ done: index, total: SERIES.length, label: series.label });
    try {
      const parsed = await fetchSeries(series);
      for (const entry of parsed) {
        const key = entryKey(entry);
        const previous = oldByKey.get(key);
        nextByKey.set(key, {
          ...entry,
          firstSeen: previous?.firstSeen ?? (previous ? 0 : Date.now()),
        });
        if (!previous) added += 1;
      }
    } catch (error) {
      errors.push(`${series.label}：${error instanceof Error ? error.message : '同步失败'}`);
      // Keep everything we already knew about this series.
      for (const entry of existing.entries) {
        if (entry.seriesId === series.id && !nextByKey.has(entryKey(entry))) {
          nextByKey.set(entryKey(entry), entry);
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  onProgress?.({ done: SERIES.length, total: SERIES.length, label: '完成' });

  if (nextByKey.size === 0) throw new Error('同步失败，未获得任何目录数据');

  const order = new Map(SERIES.map((series, index) => [series.id, index]));
  const entries = Array.from(nextByKey.values()).sort((a, b) => {
    const seriesA = order.get(a.seriesId) ?? 999;
    const seriesB = order.get(b.seriesId) ?? 999;
    if (seriesA !== seriesB) return seriesA - seriesB;
    return a.position - b.position;
  });

  const catalog: Catalog = {
    generatedAt: Date.now(),
    source: existing.source,
    entries,
  };

  return { catalog, added, errors };
}

export function syncStateFor(result: SyncResult, previous: SyncState | null): SyncState {
  return {
    lastSync: Date.now(),
    added: result.added,
    total: result.catalog.entries.length,
    errors: result.errors.length ? result.errors : previous?.errors?.slice(0, 0) ?? [],
  };
}
