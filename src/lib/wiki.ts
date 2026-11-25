import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { SITE } from './constants';
import { codeNumber, readingMinutes } from './format';
import { sanitizeArticle } from './sanitize';
import type { Article, Branch, Entry, NavRef, SeriesDef, WikiErrorCode } from './types';

export class WikiError extends Error {
  code: WikiErrorCode;
  status?: number;

  constructor(code: WikiErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'WikiError';
    this.code = code;
    this.status = status;
  }
}

const NATIVE = Capacitor.isNativePlatform();
const UA =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36 SCPArchive/0.1';

function proxyPath(branch: Branch, path: string): string {
  return `/wiki/${branch}/${path.replace(/^\/+/, '')}`;
}

async function readResponse(response: Response): Promise<string> {
  if (response.status === 404) throw new WikiError('not-found', '条目不存在', 404);
  if (response.status === 403 || response.status === 429) {
    throw new WikiError('blocked', '访问被限制，请稍后重试', response.status);
  }
  if (!response.ok) throw new WikiError('network', `请求失败 (${response.status})`, response.status);
  return response.text();
}

async function fetchWithTimeout(url: string, timeoutMs = 25_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'text/html,application/xhtml+xml' },
      credentials: 'omit',
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchWikiHtml(branch: Branch, path: string): Promise<string> {
  if (NATIVE) {
    try {
      const response = await CapacitorHttp.get({
        url: `${SITE[branch]}/${path.replace(/^\/+/, '')}`,
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': UA,
        },
        connectTimeout: 20_000,
        readTimeout: 30_000,
        responseType: 'text',
      });
      if (response.status === 404) throw new WikiError('not-found', '条目不存在', 404);
      if (response.status === 403 || response.status === 429) {
        throw new WikiError('blocked', '访问被限制，请稍后重试', response.status);
      }
      if (response.status < 200 || response.status >= 400) {
        throw new WikiError('network', `请求失败 (${response.status})`, response.status);
      }
      const data = response.data;
      if (typeof data !== 'string') {
        throw new WikiError('parse', '返回内容格式异常');
      }
      return data;
    } catch (error) {
      if (error instanceof WikiError) throw error;
      throw new WikiError('network', '网络连接失败');
    }
  }

  try {
    const response = await fetchWithTimeout(proxyPath(branch, path));
    return await readResponse(response);
  } catch (error) {
    if (error instanceof WikiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new WikiError('network', '请求超时');
    }
    throw new WikiError('network', '网络连接失败');
  }
}

function parseNavLink(anchor: HTMLAnchorElement, branch: Branch): NavRef | null {
  const href = anchor.getAttribute('href') ?? '';
  const match = href.match(/^\/([a-z0-9][a-z0-9-]*)\/?$/i);
  if (!match) return null;
  const slug = match[1].toLowerCase();
  const text = (anchor.textContent ?? '').replace(/\s+/g, ' ').trim();
  const code = (text.match(/SCP-[A-Z0-9-]+/i)?.[0] ?? text ?? slug).toUpperCase();
  return { branch, slug, code, title: text || code };
}

export function parseArticle(html: string, branch: Branch, slug: string): Article {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const content = doc.querySelector('#page-content');
  if (!content) throw new WikiError('parse', '无法解析页面正文');

  const titleText = (doc.querySelector('#page-title')?.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  const bodyText = (content.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (
    /page not found|页面不存在|页面未找到|404 not found/i.test(titleText) &&
    bodyText.length < 600
  ) {
    throw new WikiError('not-found', '条目不存在', 404);
  }

  const tags = Array.from(doc.querySelectorAll('.page-tags a'))
    .map((tag) => (tag.textContent ?? '').trim())
    .filter(Boolean)
    .slice(0, 24);

  let rating: number | null = null;
  for (const element of Array.from(doc.querySelectorAll('span[id^="prw"]'))) {
    const match = (element.textContent ?? '').match(/[+-]?\d+/);
    if (match) {
      rating = Number(match[0]);
      break;
    }
  }

  const infoText = (doc.querySelector('#page-info')?.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  const updated = infoText ? infoText.slice(0, 160) : null;

  const navAnchors = Array.from(doc.querySelectorAll('.footer-wikiwalk-nav a'))
    .map((anchor) => parseNavLink(anchor as HTMLAnchorElement, branch))
    .filter((item): item is NavRef => Boolean(item) && item!.slug !== slug);

  let prev: NavRef | null = null;
  let next: NavRef | null = null;
  if (navAnchors.length >= 2) {
    prev = navAnchors[0];
    next = navAnchors[1];
  } else if (navAnchors.length === 1) {
    const current = codeNumber(slug.replace(/[^0-9]/g, ''));
    if (codeNumber(navAnchors[0].code) < current) prev = navAnchors[0];
    else next = navAnchors[0];
  }

  const sanitized = sanitizeArticle(content.innerHTML, branch);
  const code =
    (titleText.match(/SCP-[A-Z0-9-]+/i)?.[0] ?? slug).toUpperCase().replace(/\/.*$/, '') ||
    slug.toUpperCase();

  return {
    branch,
    slug,
    code,
    title: titleText || code,
    html: sanitized.html,
    tags,
    rating,
    updated,
    toc: sanitized.toc,
    prev,
    next,
    sourceUrl: `${SITE[branch]}/${slug}`,
    fetchedAt: Date.now(),
    minutes: readingMinutes(sanitized.html),
  };
}

export async function fetchArticle(branch: Branch, slug: string): Promise<Article> {
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) {
    throw new WikiError('not-found', '无效的条目编号', 404);
  }
  const html = await fetchWikiHtml(branch, slug);
  return parseArticle(html, branch, slug);
}

export function parseSeriesPage(html: string, series: SeriesDef): Entry[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const content = doc.querySelector('#page-content');
  if (!content) throw new WikiError('parse', '无法解析系列目录');

  const entries: Entry[] = [];
  const seen = new Set<string>();

  for (const anchor of Array.from(content.querySelectorAll('li > a'))) {
    const href = anchor.getAttribute('href') ?? '';
    const match = href.match(/^\/(scp-[a-z0-9-]+)\/?$/i);
    if (!match) continue;
    const slug = match[1].toLowerCase();
    const code = (anchor.textContent ?? '').replace(/\s+/g, ' ').trim().toUpperCase();
    if (!/^SCP-[A-Z0-9-]+$/.test(code)) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);

    const listItem = anchor.closest('li');
    let title = (listItem?.textContent ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(new RegExp(`^${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '')
      .replace(/^[\s\-–—:：|]+/, '')
      .trim();
    if (!title) title = code;

    entries.push({
      branch: series.branch,
      slug,
      code,
      title: title.slice(0, 200),
      seriesId: series.id,
      position: entries.length,
      firstSeen: 0,
    });
  }

  if (!entries.length) throw new WikiError('parse', '系列目录为空');
  return entries;
}

export async function fetchSeries(series: SeriesDef): Promise<Entry[]> {
  const html = await fetchWikiHtml(series.branch, series.page);
  return parseSeriesPage(html, series);
}

export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}
