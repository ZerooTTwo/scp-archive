import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ensureCatalog, peekCatalog, saveCatalog, seriesCounts } from '../lib/catalog';
import { SYNC_INTERVAL_MS } from '../lib/constants';
import { readSync, writeSync } from '../lib/db';
import { isOnline } from '../lib/wiki';
import { performSync, type SyncProgress } from '../lib/sync';
import type { Entry, SyncState } from '../lib/types';
import { useToast } from './toast';

interface CatalogContextValue {
  entries: Entry[];
  counts: Record<string, number>;
  total: number;
  loading: boolean;
  error: string | null;
  syncState: SyncState | null;
  syncing: boolean;
  progress: SyncProgress | null;
  lastSync: number;
  newCount: number;
  syncNow: (options?: { silent?: boolean }) => Promise<boolean>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const syncingRef = useRef(false);
  const syncRef = useRef<SyncState | null>(null);
  const bootedRef = useRef(false);

  const syncNow = useCallback<CatalogContextValue['syncNow']>(
    async (options) => {
      const silent = Boolean(options?.silent);
      if (syncingRef.current) return false;
      if (!isOnline()) {
        if (!silent) toast('当前离线，继续使用本地目录');
        return false;
      }

      syncingRef.current = true;
      setSyncing(true);
      setProgress({ done: 0, total: 15, label: '准备同步' });

      try {
        const existing = peekCatalog() ?? (await ensureCatalog());
        const result = await performSync(existing, setProgress);
        await saveCatalog(result.catalog);
        const nextState: SyncState = {
          lastSync: Date.now(),
          added: result.added,
          total: result.catalog.entries.length,
          errors: result.errors,
        };
        await writeSync(nextState);
        syncRef.current = nextState;
        setSyncState(nextState);
        setEntries(result.catalog.entries);

        if (!silent) {
          if (result.errors.length) {
            toast(`同步完成，但有 ${result.errors.length} 个系列失败`, { duration: 4000 });
          } else if (result.added > 0) {
            toast(`同步完成 · 新增 ${result.added} 条档案`, {
              actionLabel: '看看',
              onAction: () => {
                window.location.hash = '#/browse';
              },
            });
          } else {
            toast('目录已是最新');
          }
        }
        return true;
      } catch (syncError) {
        if (!silent) {
          toast(syncError instanceof Error ? syncError.message : '同步失败，继续使用本地目录', {
            duration: 4000,
          });
        }
        return false;
      } finally {
        syncingRef.current = false;
        setSyncing(false);
        setProgress(null);
      }
    },
    [toast],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const catalog = await ensureCatalog();
        if (cancelled) return;
        setEntries(catalog.entries);
        setLoading(false);

        let stored = await readSync();
        if (!stored) {
          stored = {
            lastSync: catalog.generatedAt,
            added: 0,
            total: catalog.entries.length,
            errors: [],
          };
          await writeSync(stored);
        }
        if (cancelled) return;
        syncRef.current = stored;
        setSyncState(stored);

        const stale = Date.now() - stored.lastSync > SYNC_INTERVAL_MS;
        if (!bootedRef.current && stale && isOnline()) {
          bootedRef.current = true;
          void syncNow({ silent: true });
        }
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : '无法读取本地目录');
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [syncNow]);

  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== 'visible') return;
      const state = syncRef.current;
      if (!state || syncingRef.current || !isOnline()) return;
      if (Date.now() - state.lastSync > SYNC_INTERVAL_MS) void syncNow({ silent: true });
    };
    document.addEventListener('visibilitychange', check);
    window.addEventListener('online', check);
    return () => {
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('online', check);
    };
  }, [syncNow]);

  const counts = useMemo(() => seriesCounts(entries), [entries]);
  const newCount = useMemo(
    () => entries.reduce((total, entry) => (entry.firstSeen > 0 ? total + 1 : total), 0),
    [entries],
  );

  const value = useMemo<CatalogContextValue>(
    () => ({
      entries,
      counts,
      total: entries.length,
      loading,
      error,
      syncState,
      syncing,
      progress,
      lastSync: syncState?.lastSync ?? 0,
      newCount,
      syncNow,
    }),
    [entries, counts, loading, error, syncState, syncing, progress, newCount, syncNow],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog must be used inside CatalogProvider');
  return context;
}
