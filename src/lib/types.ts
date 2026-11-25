export type Branch = 'cn' | 'en';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface Entry {
  branch: Branch;
  slug: string;
  code: string;
  title: string;
  seriesId: string;
  source?: 'original' | 'translated';
  position: number;
  /** Timestamp when this entry was first discovered by a sync (0 = bundled seed). */
  firstSeen: number;
}

export interface Catalog {
  generatedAt: number;
  source?: string;
  entries: Entry[];
}

export interface SeriesDef {
  id: string;
  branch: Branch;
  page: string;
  label: string;
  shortLabel: string;
  range: string;
  roman: string;
  source: 'original' | 'translated';
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface NavRef {
  branch: Branch;
  slug: string;
  code: string;
  title: string;
}

export interface Article {
  branch: Branch;
  slug: string;
  code: string;
  title: string;
  html: string;
  tags: string[];
  rating: number | null;
  updated: string | null;
  toc: TocItem[];
  prev: NavRef | null;
  next: NavRef | null;
  sourceUrl: string;
  fetchedAt: number;
  minutes: number;
}

export interface ProgressRecord {
  branch: Branch;
  slug: string;
  code: string;
  title: string;
  percent: number;
  updatedAt: number;
}

export interface FavoriteRecord {
  branch: Branch;
  slug: string;
  code: string;
  title: string;
  addedAt: number;
}

export interface OfflineRecord {
  branch: Branch;
  slug: string;
  code: string;
  title: string;
  bytes: number;
  at: number;
}

export interface Settings {
  theme: ThemeMode;
  fontScale: number;
  lineHeight: number;
  serif: boolean;
  branch: Branch;
}

export interface SyncState {
  lastSync: number;
  added: number;
  total: number;
  errors: string[];
}

export type WikiErrorCode = 'not-found' | 'network' | 'blocked' | 'parse';
