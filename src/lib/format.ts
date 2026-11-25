const numberFormatter = new Intl.NumberFormat('zh-CN');
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDate(timestamp: number | null | undefined): string {
  if (!timestamp) return '—';
  return dateFormatter.format(new Date(timestamp));
}

export function formatDateTime(timestamp: number | null | undefined): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return `${dateFormatter.format(date)} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

export function relativeTime(timestamp: number | null | undefined): string {
  if (!timestamp) return '尚未同步';
  const diff = Date.now() - timestamp;
  if (diff < 0) return '刚刚';
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 2 * day) return '昨天';
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`;
  return formatDate(timestamp);
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`;
}

/** Numeric part of an SCP code, used for ordering ("SCP-CN-173" → 173). */
export function codeNumber(code: string): number {
  const matches = code.match(/\d+/g);
  if (!matches?.length) return Number.MAX_SAFE_INTEGER;
  return Number(matches[matches.length - 1]);
}

export function padCode(value: number): string {
  return String(value).padStart(3, '0');
}

export function branchOfPath(path: string): 'cn' | 'en' | null {
  if (path === 'cn' || path === 'en') return path;
  return null;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function readingMinutes(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ');
  const cjk = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
  const words = text
    .replace(/[\u3400-\u9fff]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(cjk / 330 + words / 220));
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
