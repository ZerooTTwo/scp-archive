import type { Branch, SeriesDef, Settings } from './types';

export const SITE: Record<Branch, string> = {
  cn: 'https://scp-wiki-cn.wikidot.com',
  en: 'https://scp-wiki.wikidot.com',
};

export const BRANCH_LABEL: Record<Branch, string> = {
  cn: '中文分部',
  en: '英文总部',
};

export const BRANCH_SHORT: Record<Branch, string> = {
  cn: 'CN',
  en: 'EN',
};

export const SERIES: SeriesDef[] = [
  { id: 'cn-1', branch: 'cn', page: 'scp-series-cn', label: '中文系列 I', range: '001 – 999', roman: 'I' },
  { id: 'cn-2', branch: 'cn', page: 'scp-series-cn-2', label: '中文系列 II', range: '1000 – 1999', roman: 'II' },
  { id: 'cn-3', branch: 'cn', page: 'scp-series-cn-3', label: '中文系列 III', range: '2000 – 2999', roman: 'III' },
  { id: 'cn-4', branch: 'cn', page: 'scp-series-cn-4', label: '中文系列 IV', range: '3000 – 3999', roman: 'IV' },
  { id: 'cn-5', branch: 'cn', page: 'scp-series-cn-5', label: '中文系列 V', range: '4000 – 4999', roman: 'V' },
  { id: 'en-1', branch: 'en', page: 'scp-series', label: '系列 I', range: '001 – 999', roman: 'I' },
  { id: 'en-2', branch: 'en', page: 'scp-series-2', label: '系列 II', range: '1000 – 1999', roman: 'II' },
  { id: 'en-3', branch: 'en', page: 'scp-series-3', label: '系列 III', range: '2000 – 2999', roman: 'III' },
  { id: 'en-4', branch: 'en', page: 'scp-series-4', label: '系列 IV', range: '3000 – 3999', roman: 'IV' },
  { id: 'en-5', branch: 'en', page: 'scp-series-5', label: '系列 V', range: '4000 – 4999', roman: 'V' },
  { id: 'en-6', branch: 'en', page: 'scp-series-6', label: '系列 VI', range: '5000 – 5999', roman: 'VI' },
  { id: 'en-7', branch: 'en', page: 'scp-series-7', label: '系列 VII', range: '6000 – 6999', roman: 'VII' },
  { id: 'en-8', branch: 'en', page: 'scp-series-8', label: '系列 VIII', range: '7000 – 7999', roman: 'VIII' },
  { id: 'en-9', branch: 'en', page: 'scp-series-9', label: '系列 IX', range: '8000 – 8999', roman: 'IX' },
  { id: 'en-10', branch: 'en', page: 'scp-series-10', label: '系列 X', range: '9000 – 9999', roman: 'X' },
];

export const SERIES_BY_ID = new Map(SERIES.map((series) => [series.id, series]));

export function seriesForBranch(branch: Branch): SeriesDef[] {
  return SERIES.filter((series) => series.branch === branch);
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  fontScale: 1,
  lineHeight: 1.9,
  serif: false,
  branch: 'cn',
};

/** Sync at most once every 12 hours unless the user asks explicitly. */
export const SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000;
/** Re-fetch an article in the background when the cached copy is older than this. */
export const ARTICLE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Keep at most this many article bodies on disk. */
export const OFFLINE_LIMIT = 300;
export const HISTORY_LIMIT = 80;

export const REPO_URL = 'https://github.com/scp-archive/scp-archive';
export const WIKI_LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/3.0/';
