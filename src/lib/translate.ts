import { Capacitor, CapacitorHttp } from '@capacitor/core';
import type { Article, TranslationConfig, TranslationRecord } from './types';

const NATIVE = Capacitor.isNativePlatform();
const MAX_BATCH_CHARS = 4_800;
const MAX_BATCH_ITEMS = 24;
const MAX_SEGMENT_CHARS = 6_000;

export class TranslationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranslationError';
  }
}

export function translationConfigured(config: TranslationConfig): boolean {
  return Boolean(config.endpoint.trim() && config.model.trim());
}

export function translationHost(config: TranslationConfig): string {
  try {
    return new URL(config.endpoint).host;
  } catch {
    return config.endpoint;
  }
}

function chatUrl(endpoint: string): string {
  const trimmed = endpoint.trim().replace(/\/+$/, '');
  if (/\/chat\/completions$/i.test(trimmed)) return trimmed;
  return `${trimmed}/chat/completions`;
}

interface ChatPayload {
  model: string;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  temperature: number;
  stream: false;
}

function errorMessage(data: unknown): string {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const error = record.error;
    if (error && typeof error === 'object') {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === 'string') return message;
    }
    if (typeof record.message === 'string') return record.message;
  }
  return '';
}

function contentText(data: unknown): string {
  if (!data || typeof data !== 'object') throw new TranslationError('翻译接口返回了空响应');
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || !choices.length) {
    const message = errorMessage(data);
    throw new TranslationError(message || '翻译接口返回格式异常');
  }
  const message = (choices[0] as { message?: { content?: unknown } })?.message;
  const content = message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string'
          ? (part as { text: string }).text
          : '',
      )
      .join('');
  }
  throw new TranslationError('翻译接口没有返回文本');
}

async function postChat(config: TranslationConfig, payload: ChatPayload): Promise<string> {
  const url = chatUrl(config.endpoint);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (config.apiKey.trim()) headers.Authorization = `Bearer ${config.apiKey.trim()}`;

  let status = 0;
  let data: unknown = null;

  try {
    if (NATIVE) {
      const response = await CapacitorHttp.post({
        url,
        headers,
        data: payload,
        connectTimeout: 20_000,
        readTimeout: 120_000,
        responseType: 'json',
      });
      status = response.status;
      data = response.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          // Keep the raw body so the status handling can surface it.
        }
      }
    } else {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 120_000);
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        status = response.status;
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      } finally {
        window.clearTimeout(timer);
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new TranslationError('翻译请求超时，请稍后重试');
    }
    const detail = error instanceof Error ? error.message : '';
    if (/Failed to fetch|NetworkError|Load failed/i.test(detail)) {
      throw new TranslationError(
        NATIVE
          ? '无法连接翻译接口，请检查网络与 Endpoint'
          : '浏览器无法直连该接口（可能是 CORS 限制），请换用允许跨域的接口',
      );
    }
    throw new TranslationError(detail || '无法连接翻译接口');
  }

  if (status === 401 || status === 403) {
    throw new TranslationError('API Key 无效或没有权限（401/403）');
  }
  if (status === 429) throw new TranslationError('接口请求过于频繁或额度用完（429）');
  if (status < 200 || status >= 300) {
    const detail = errorMessage(data) || (typeof data === 'string' ? data.slice(0, 160) : '');
    throw new TranslationError(`翻译接口返回 ${status}${detail ? `：${detail}` : ''}`);
  }
  return contentText(data);
}

function parseStringArray(raw: string): string[] {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start < 0 || end <= start) {
    throw new TranslationError('模型没有返回 JSON 数组，请换用支持 JSON 输出的模型');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new TranslationError('模型返回的 JSON 无法解析，请重试或更换模型');
  }

  const list =
    Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')
      ? parsed
      : parsed && typeof parsed === 'object' && Array.isArray((parsed as { translations?: unknown }).translations)
        ? (parsed as { translations: unknown[] }).translations
        : null;
  if (!list || !list.every((item) => typeof item === 'string')) {
    throw new TranslationError('模型返回的译文格式不正确');
  }
  return list as string[];
}

const SYSTEM_PROMPT =
  '你是 SCP 基金会中文维基的资深译者。把用户提供的 JSON 字符串数组逐条翻译为简体中文。' +
  '保留 SCP 编号、专有名词、URL、换行和原有语气；不要添加解释；不要输出 Markdown。' +
  '必须只输出一个 JSON 字符串数组，元素数量、顺序与输入完全一致。';

export async function translateTexts(
  config: TranslationConfig,
  texts: string[],
): Promise<string[]> {
  if (!translationConfigured(config)) {
    throw new TranslationError('请先在设置中填写翻译接口与模型');
  }
  const content = await postChat(config, {
    model: config.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify({ target: '简体中文', texts }) },
    ],
    temperature: 0.2,
    stream: false,
  });
  const translated = parseStringArray(content);
  if (translated.length !== texts.length) {
    throw new TranslationError(
      `模型返回了 ${translated.length} 条译文，预期 ${texts.length} 条，请重试`,
    );
  }
  return translated;
}

interface TextSegment {
  node: Text;
  prefix: string;
  suffix: string;
  text: string;
}

function textSegments(html: string): { doc: Document; segments: TextSegment[] } {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const segments: TextSegment[] = [];
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    const node = current as Text;
    const parent = node.parentElement;
    const raw = node.nodeValue ?? '';
    const text = raw.trim();
    if (
      parent &&
      !parent.closest('script, style, pre, code') &&
      text.length >= 2 &&
      text.length <= MAX_SEGMENT_CHARS &&
      /[A-Za-z]{2}/.test(text)
    ) {
      const leading = raw.match(/^\s*/)?.[0] ?? '';
      const trailing = raw.match(/\s*$/)?.[0] ?? '';
      segments.push({ node, prefix: leading, suffix: trailing, text });
    }
    current = walker.nextNode();
  }
  return { doc, segments };
}

function batches(segments: TextSegment[]): Array<{ start: number; items: TextSegment[] }> {
  const result: Array<{ start: number; items: TextSegment[] }> = [];
  let start = 0;
  while (start < segments.length) {
    let chars = 0;
    let end = start;
    while (end < segments.length && end - start < MAX_BATCH_ITEMS) {
      const size = segments[end].text.length;
      if (end > start && chars + size > MAX_BATCH_CHARS) break;
      chars += size;
      end += 1;
    }
    result.push({ start, items: segments.slice(start, end) });
    start = end;
  }
  return result;
}

export async function translateArticle(
  article: Article,
  config: TranslationConfig,
  onProgress?: (done: number, total: number) => void,
): Promise<TranslationRecord> {
  const { doc, segments } = textSegments(article.html);
  const groups = batches(segments);
  const total = groups.length + 1;
  let done = 0;

  const translatedTitle = (await translateTexts(config, [article.title]))[0] ?? article.title;
  done += 1;
  onProgress?.(done, total);

  for (const group of groups) {
    const translated = await translateTexts(
      config,
      group.items.map((item) => item.text),
    );
    group.items.forEach((item, index) => {
      const value = translated[index];
      if (typeof value === 'string' && value.trim()) {
        item.node.nodeValue = `${item.prefix}${value.trim()}${item.suffix}`;
      }
    });
    done += 1;
    onProgress?.(done, total);
  }

  return {
    branch: article.branch,
    slug: article.slug,
    title: translatedTitle.trim() || article.title,
    html: doc.body.innerHTML,
    model: config.model,
    translatedAt: Date.now(),
    sourceFetchedAt: article.fetchedAt,
  };
}

export async function testTranslation(config: TranslationConfig): Promise<string> {
  const [sample] = await translateTexts(config, [
    'The sculpture cannot move while it is being observed.',
  ]);
  return sample ?? '';
}
