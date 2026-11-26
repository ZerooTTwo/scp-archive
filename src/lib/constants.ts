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
  { id: 'cn-t1', branch: 'cn', page: 'scp-series', label: '中文译文 I', shortLabel: '译 I', range: '001 – 999', roman: 'I', source: 'translated' },
  { id: 'cn-t2', branch: 'cn', page: 'scp-series-2', label: '中文译文 II', shortLabel: '译 II', range: '1000 – 1999', roman: 'II', source: 'translated' },
  { id: 'cn-t3', branch: 'cn', page: 'scp-series-3', label: '中文译文 III', shortLabel: '译 III', range: '2000 – 2999', roman: 'III', source: 'translated' },
  { id: 'cn-t4', branch: 'cn', page: 'scp-series-4', label: '中文译文 IV', shortLabel: '译 IV', range: '3000 – 3999', roman: 'IV', source: 'translated' },
  { id: 'cn-t5', branch: 'cn', page: 'scp-series-5', label: '中文译文 V', shortLabel: '译 V', range: '4000 – 4999', roman: 'V', source: 'translated' },
  { id: 'cn-t6', branch: 'cn', page: 'scp-series-6', label: '中文译文 VI', shortLabel: '译 VI', range: '5000 – 5999', roman: 'VI', source: 'translated' },
  { id: 'cn-t7', branch: 'cn', page: 'scp-series-7', label: '中文译文 VII', shortLabel: '译 VII', range: '6000 – 6999', roman: 'VII', source: 'translated' },
  { id: 'cn-t8', branch: 'cn', page: 'scp-series-8', label: '中文译文 VIII', shortLabel: '译 VIII', range: '7000 – 7999', roman: 'VIII', source: 'translated' },
  { id: 'cn-t9', branch: 'cn', page: 'scp-series-9', label: '中文译文 IX', shortLabel: '译 IX', range: '8000 – 8999', roman: 'IX', source: 'translated' },
  { id: 'cn-t10', branch: 'cn', page: 'scp-series-10', label: '中文译文 X', shortLabel: '译 X', range: '9000 – 9999', roman: 'X', source: 'translated' },
  { id: 'cn-1', branch: 'cn', page: 'scp-series-cn', label: '中文原创 I', shortLabel: '原 I', range: 'CN-001 – 999', roman: 'I', source: 'original' },
  { id: 'cn-2', branch: 'cn', page: 'scp-series-cn-2', label: '中文原创 II', shortLabel: '原 II', range: 'CN-1000 – 1999', roman: 'II', source: 'original' },
  { id: 'cn-3', branch: 'cn', page: 'scp-series-cn-3', label: '中文原创 III', shortLabel: '原 III', range: 'CN-2000 – 2999', roman: 'III', source: 'original' },
  { id: 'cn-4', branch: 'cn', page: 'scp-series-cn-4', label: '中文原创 IV', shortLabel: '原 IV', range: 'CN-3000 – 3999', roman: 'IV', source: 'original' },
  { id: 'cn-5', branch: 'cn', page: 'scp-series-cn-5', label: '中文原创 V', shortLabel: '原 V', range: 'CN-4000 – 4999', roman: 'V', source: 'original' },
  { id: 'en-1', branch: 'en', page: 'scp-series', label: '系列 I', shortLabel: 'I', range: '001 – 999', roman: 'I', source: 'original' },
  { id: 'en-2', branch: 'en', page: 'scp-series-2', label: '系列 II', shortLabel: 'II', range: '1000 – 1999', roman: 'II', source: 'original' },
  { id: 'en-3', branch: 'en', page: 'scp-series-3', label: '系列 III', shortLabel: 'III', range: '2000 – 2999', roman: 'III', source: 'original' },
  { id: 'en-4', branch: 'en', page: 'scp-series-4', label: '系列 IV', shortLabel: 'IV', range: '3000 – 3999', roman: 'IV', source: 'original' },
  { id: 'en-5', branch: 'en', page: 'scp-series-5', label: '系列 V', shortLabel: 'V', range: '4000 – 4999', roman: 'V', source: 'original' },
  { id: 'en-6', branch: 'en', page: 'scp-series-6', label: '系列 VI', shortLabel: 'VI', range: '5000 – 5999', roman: 'VI', source: 'original' },
  { id: 'en-7', branch: 'en', page: 'scp-series-7', label: '系列 VII', shortLabel: 'VII', range: '6000 – 6999', roman: 'VII', source: 'original' },
  { id: 'en-8', branch: 'en', page: 'scp-series-8', label: '系列 VIII', shortLabel: 'VIII', range: '7000 – 7999', roman: 'VIII', source: 'original' },
  { id: 'en-9', branch: 'en', page: 'scp-series-9', label: '系列 IX', shortLabel: 'IX', range: '8000 – 8999', roman: 'IX', source: 'original' },
  { id: 'en-10', branch: 'en', page: 'scp-series-10', label: '系列 X', shortLabel: 'X', range: '9000 – 9999', roman: 'X', source: 'original' },
];

export const SERIES_BY_ID = new Map(SERIES.map((series) => [series.id, series]));

export function seriesForBranch(branch: Branch): SeriesDef[] {
  return SERIES.filter((series) => series.branch === branch);
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  clearance: 'o5',
  appIcon: 'official',
  fontScale: 1,
  lineHeight: 1.9,
  serif: false,
  branch: 'cn',
  translation: {
    endpoint: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    apiKey: '',
  },
};

/** Sync at most once every 12 hours unless the user asks explicitly. */
export const SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000;
/** Re-fetch an article in the background when the cached copy is older than this. */
export const ARTICLE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Keep at most this many article bodies on disk. */
export const OFFLINE_LIMIT = 300;
export const HISTORY_LIMIT = 80;

export const REPO_URL = 'https://github.com/ZerooTTwo/scp-archive';
export const WIKI_LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/3.0/';
