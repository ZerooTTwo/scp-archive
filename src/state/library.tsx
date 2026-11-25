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
import { HISTORY_LIMIT } from '../lib/constants';
import {
  readFavorites,
  readHistory,
  readOffline,
  writeFavorites,
  writeHistory,
} from '../lib/db';
import {
  cacheArticle,
  clearOffline,
  forgetReadingProgress,
  removeOffline,
  saveReadingProgress,
} from '../lib/library';
import { fetchArticle } from '../lib/wiki';
import type {
  Entry,
  FavoriteRecord,
  OfflineRecord,
  ProgressRecord,
} from '../lib/types';
import { useToast } from './toast';

interface LibraryContextValue {
  favorites: FavoriteRecord[];
  history: ProgressRecord[];
  offline: OfflineRecord[];
  offlineKeys: Set<string>;
  progressMap: Map<string, number>;
  ready: boolean;
  isFavorite: (branch: string, slug: string) => boolean;
  toggleFavorite: (entry: FavoriteTarget) => void;
  removeFavorite: (entry: Pick<Entry, 'branch' | 'slug'>) => void;
  saveProgress: (record: ProgressRecord) => void;
  clearHistory: () => Promise<void>;
  removeOfflineArticle: (branch: string, slug: string) => Promise<void>;
  clearOfflineLibrary: () => Promise<void>;
  refreshOffline: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

const keyOf = (branch: string, slug: string) => `${branch}:${slug}`;

type FavoriteTarget = Pick<Entry, 'branch' | 'slug' | 'code' | 'title'>;

export function LibraryProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [history, setHistory] = useState<ProgressRecord[]>([]);
  const [offline, setOffline] = useState<OfflineRecord[]>([]);
  const [ready, setReady] = useState(false);
  const downloading = useRef(new Set<string>());
  const offlineRef = useRef<OfflineRecord[]>([]);

  useEffect(() => {
    offlineRef.current = offline;
  }, [offline]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([readFavorites(), readHistory(), readOffline()]).then(
      ([savedFavorites, savedHistory, savedOffline]) => {
        if (cancelled) return;
        setFavorites(savedFavorites);
        setHistory(savedHistory);
        setOffline(savedOffline);
        setReady(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const isFavorite = useCallback(
    (branch: string, slug: string) =>
      favorites.some((item) => item.branch === branch && item.slug === slug),
    [favorites],
  );

  const downloadForOffline = useCallback(
    async (entry: FavoriteTarget) => {
      const key = keyOf(entry.branch, entry.slug);
      if (offlineRef.current.some((item) => keyOf(item.branch, item.slug) === key)) return;
      if (downloading.current.has(key)) return;
      downloading.current.add(key);
      try {
        const article = await fetchArticle(entry.branch, entry.slug);
        await cacheArticle(article);
        const list = await readOffline();
        offlineRef.current = list;
        setOffline(list);
        toast('正文已离线保存', { duration: 1800 });
      } catch {
        toast('已收藏，正文将在联网后缓存', { duration: 3000 });
      } finally {
        downloading.current.delete(key);
      }
    },
    [toast],
  );

  const toggleFavorite = useCallback(
    (entry: FavoriteTarget) => {
      const exists = favorites.some(
        (item) => item.branch === entry.branch && item.slug === entry.slug,
      );
      if (exists) {
        const next = favorites.filter(
          (item) => !(item.branch === entry.branch && item.slug === entry.slug),
        );
        setFavorites(next);
        void writeFavorites(next);
        toast('已取消收藏', {
          actionLabel: '撤销',
          onAction: () => {
            setFavorites((current) => {
              if (current.some((item) => keyOf(item.branch, item.slug) === keyOf(entry.branch, entry.slug))) {
                return current;
              }
              const restored = [
                {
                  branch: entry.branch,
                  slug: entry.slug,
                  code: entry.code,
                  title: entry.title,
                  addedAt: Date.now(),
                },
                ...current,
              ];
              void writeFavorites(restored);
              return restored;
            });
          },
        });
        return;
      }

      const record: FavoriteRecord = {
        branch: entry.branch,
        slug: entry.slug,
        code: entry.code,
        title: entry.title,
        addedAt: Date.now(),
      };
      const next = [record, ...favorites];
      setFavorites(next);
      void writeFavorites(next);
      toast('已加入收藏');
      void downloadForOffline(entry);
    },
    [downloadForOffline, favorites, toast],
  );

  const removeFavorite = useCallback(
    (entry: Pick<Entry, 'branch' | 'slug'>) => {
      const next = favorites.filter(
        (item) => !(item.branch === entry.branch && item.slug === entry.slug),
      );
      setFavorites(next);
      void writeFavorites(next);
      toast('已取消收藏');
    },
    [favorites, toast],
  );

  const saveProgress = useCallback((record: ProgressRecord) => {
    setHistory((current) => {
      const next = [
        record,
        ...current.filter(
          (item) => !(item.branch === record.branch && item.slug === record.slug),
        ),
      ].slice(0, HISTORY_LIMIT);
      void writeHistory(next);
      return next;
    });
    void saveReadingProgress(record);
  }, []);

  const clearHistory = useCallback(async () => {
    const current = await readHistory();
    await writeHistory([]);
    await Promise.all(
      current.map((item) => forgetReadingProgress(item.branch, item.slug)),
    );
    setHistory([]);
  }, []);

  const removeOfflineArticle = useCallback(
    async (branch: string, slug: string) => {
      await removeOffline(branch, slug);
      const list = await readOffline();
      offlineRef.current = list;
      setOffline(list);
    },
    [],
  );

  const clearOfflineLibrary = useCallback(async () => {
    await clearOffline();
    offlineRef.current = [];
    setOffline([]);
  }, []);

  const refreshOffline = useCallback(async () => {
    const list = await readOffline();
    offlineRef.current = list;
    setOffline(list);
  }, []);

  const offlineKeys = useMemo(
    () => new Set(offline.map((item) => keyOf(item.branch, item.slug))),
    [offline],
  );

  const progressMap = useMemo(
    () => new Map(history.map((item) => [keyOf(item.branch, item.slug), item.percent])),
    [history],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      favorites,
      history,
      offline,
      offlineKeys,
      progressMap,
      ready,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      saveProgress,
      clearHistory,
      removeOfflineArticle,
      clearOfflineLibrary,
      refreshOffline,
    }),
    [
      favorites,
      history,
      offline,
      offlineKeys,
      progressMap,
      ready,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      saveProgress,
      clearHistory,
      removeOfflineArticle,
      clearOfflineLibrary,
      refreshOffline,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used inside LibraryProvider');
  return context;
}
