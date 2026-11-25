import { SERIES, SITE } from './constants';
import { readingMinutes } from './format';
import type { Branch, TocItem } from './types';

/**
 * Wikidot stores article content as trusted HTML, but it is third-party content
 * loaded over the network. Everything here is rebuilt from an allowlist:
 *  - tags not on the list are unwrapped (text kept) or dropped (active content)
 *  - attributes are reconstructed; no event handlers, no javascript: URLs
 *  - inline CSS is limited to presentation properties
 *  - wiki links become in-app routes / anchors handled by the reader
 */

const DROP_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'applet',
  'form',
  'input',
  'button',
  'select',
  'option',
  'textarea',
  'noscript',
  'link',
  'meta',
  'base',
  'frame',
  'frameset',
  'svg',
  'math',
  'canvas',
  'map',
  'area',
  'video',
  'audio',
  'source',
  'track',
  'portal',
]);

const ALLOWED_TAGS = new Set([
  'a',
  'abbr',
  'b',
  'blockquote',
  'br',
  'caption',
  'center',
  'cite',
  'code',
  'dd',
  'del',
  'details',
  'dfn',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'ins',
  'kbd',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
  'var',
]);

const ALLOWED_ATTRS = new Set([
  'alt',
  'title',
  'width',
  'height',
  'colspan',
  'rowspan',
  'align',
  'valign',
  'scope',
  'headers',
  'start',
  'reversed',
  'type',
  'datetime',
  'cite',
  'open',
  'summary',
  'lang',
  'dir',
]);

const DROP_SELECTORS = [
  '#page-title',
  '.page-title',
  '.page-tags',
  '.page-info',
  '.footer-wikiwalk-nav',
  '.content-toc',
  '#toc',
  '.toc',
  '.page-options-container',
  '.page-options-bottom',
  '.page-options-top',
  '.pager',
  '.creditRate',
  '#creditRate',
  '.rate-box-with-credit-button',
  '#u-credit-view',
  '.credit-button',
  '.page-rate-widget-box',
  '.modalbox',
  '#lightbox',
  '.owindow',
  '.odialog',
  '.print-footer',
  '.print-only',
  '.edit-page',
  '.history-page',
  '.view-source',
  '.discuss-button',
  '.comment-box',
  '.comments',
  '.error-block',
  '.wd-ad',
  '.ad-container',
].join(',');

const ALLOWED_STYLE_PROPS = new Set([
  'color',
  'background-color',
  'text-align',
  'float',
  'font-weight',
  'font-style',
  'text-decoration',
  'vertical-align',
  'border',
  'border-top',
  'border-bottom',
  'border-left',
  'border-right',
  'border-color',
  'border-collapse',
  'border-radius',
  'width',
  'max-width',
  'white-space',
  'letter-spacing',
]);

const STYLE_VALUE_BLOCKLIST = /url\s*\(|expression|javascript:|@import|behavior\s*:/i;

const SPECIAL_PAGES = new Set([
  'forum',
  'search',
  'admin',
  'account',
  'join',
  'login',
  'random',
  'newpage',
  'edit',
  'history',
  'print',
  'files',
  'feed',
  'category',
  'tag',
  'dashboard',
  'nav',
  'system',
  'scp-series',
]);

interface LinkTarget {
  kind: 'internal' | 'series' | 'anchor' | 'external' | 'collapse' | 'none';
  value?: string;
  seriesId?: string;
}

function normalisePath(raw: string): { path: string; hash: string } | null {
  let href = raw.trim();
  if (!href) return null;

  if (href.startsWith('//')) href = `https:${href}`;

  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
    let url: URL;
    try {
      url = new URL(href);
    } catch {
      return null;
    }
    if (!/^https?:$/.test(url.protocol)) return null;
    href = `${url.pathname}${url.hash}`;
  }

  let hash = '';
  const hashIndex = href.indexOf('#');
  if (hashIndex >= 0) {
    hash = href.slice(hashIndex + 1);
    href = href.slice(0, hashIndex);
  }
  const queryIndex = href.indexOf('?');
  if (queryIndex >= 0) href = href.slice(0, queryIndex);

  if (!href.startsWith('/')) href = `/${href.replace(/^\.\//, '')}`;

  // Strip the site prefix if an absolute URL was kept.
  for (const site of Object.values(SITE)) {
    const prefix = new URL(site).pathname;
    if (prefix !== '/' && href.startsWith(prefix)) href = href.slice(prefix.length);
  }
  return { path: href, hash };
}

function resolveLink(raw: string, branch: Branch): LinkTarget {
  if (!raw || raw === '#') return { kind: 'none' };

  if (/^javascript:/i.test(raw.trim())) {
    return { kind: 'collapse' };
  }

  if (raw.trim().startsWith('#')) {
    const id = decodeURIComponent(raw.trim().slice(1));
    return id ? { kind: 'anchor', value: id } : { kind: 'none' };
  }

  const parsed = normalisePath(raw);
  if (!parsed) return { kind: 'none' };
  const { path, hash } = parsed;

  if (hash && (path === '' || path === '/')) {
    const id = decodeURIComponent(hash);
    return id ? { kind: 'anchor', value: id } : { kind: 'none' };
  }

  const slug = path.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!slug) return { kind: 'none' };

  const series = SERIES.find((item) => item.page === slug);
  if (series) return { kind: 'series', seriesId: series.id };

  const firstSegment = slug.split('/')[0];
  if (!/^[a-z0-9][a-z0-9-]*$/.test(firstSegment)) {
    return { kind: 'external', value: raw };
  }
  if (SPECIAL_PAGES.has(firstSegment) || firstSegment.startsWith('_')) {
    return {
      kind: 'external',
      value: `${SITE[branch]}/${slug}${hash ? `#${hash}` : ''}`,
    };
  }

  return { kind: 'internal', value: firstSegment };
}

function sanitiseStyle(value: string): string {
  if (!value || STYLE_VALUE_BLOCKLIST.test(value)) return '';
  const probe = document.createElement('span');
  probe.setAttribute('style', value);
  const output: string[] = [];
  for (const property of ALLOWED_STYLE_PROPS) {
    const propertyValue = probe.style.getPropertyValue(property);
    if (!propertyValue || STYLE_VALUE_BLOCKLIST.test(propertyValue)) continue;
    output.push(`${property}:${propertyValue}`);
  }
  return output.join(';');
}

function sanitiseImageSource(raw: string, branch: Branch): string | null {
  let src = raw.trim();
  if (!src) return null;
  if (src.startsWith('//')) src = `https:${src}`;
  if (/^data:/i.test(src)) {
    return /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(src) ? src : null;
  }
  if (!/^[a-z][a-z0-9+.-]*:/i.test(src)) {
    try {
      src = new URL(src, `${SITE[branch]}/`).href;
    } catch {
      return null;
    }
  }
  if (src.startsWith('http://')) src = `https://${src.slice(7)}`;
  return /^https?:\/\//i.test(src) ? src : null;
}

function sanitiseId(value: string): string {
  return value.trim().replace(/[\s"'<>]+/g, '-').slice(0, 120);
}

function rebuildAttributes(element: Element, branch: Branch): void {
  const tag = element.tagName.toLowerCase();
  const attributes = Array.from(element.attributes);
  const kept = new Map<string, string>();
  const data = new Map<string, string>();
  let href: LinkTarget | null = null;
  let src: string | null = null;

  for (const attribute of attributes) {
    const name = attribute.name.toLowerCase();
    const value = attribute.value;
    if (name.startsWith('on')) continue;

    if (name === 'class') {
      const className = value.replace(/\s+/g, ' ').trim().slice(0, 300);
      if (className) kept.set('class', className);
      continue;
    }
    if (name === 'id') {
      const id = sanitiseId(value);
      if (id) kept.set('id', id);
      continue;
    }
    if (name === 'style') {
      const style = sanitiseStyle(value);
      if (style) kept.set('style', style);
      continue;
    }
    if (name === 'href' && tag === 'a') {
      href = resolveLink(value, branch);
      continue;
    }
    if (name === 'src' && tag === 'img') {
      src = sanitiseImageSource(value, branch);
      continue;
    }
    if (ALLOWED_ATTRS.has(name)) kept.set(name, value.slice(0, 2000));
  }

  // Rebuild from scratch so nothing unvetted survives.
  for (const attribute of Array.from(element.attributes)) {
    element.removeAttribute(attribute.name);
  }
  for (const [name, value] of kept) element.setAttribute(name, value);

  if (tag === 'img') {
    if (!src) {
      element.remove();
      return;
    }
    element.setAttribute('src', src);
    element.setAttribute('decoding', 'async');
    element.setAttribute('referrerpolicy', 'no-referrer');
    if (!element.getAttribute('alt')) element.setAttribute('alt', '');
    return;
  }

  if (tag !== 'a') return;

  if (!href || href.kind === 'none') {
    const isCollapseLink =
      element.classList.contains('collapsible-block-link') &&
      element.closest('.collapsible-block') !== null;
    if (isCollapseLink) {
      element.setAttribute('data-collapse', '1');
      element.setAttribute('role', 'button');
      element.setAttribute('tabindex', '0');
      return;
    }
    element.replaceWith(...Array.from(element.childNodes));
    return;
  }

  if (href.kind === 'collapse') {
    element.setAttribute('data-collapse', '1');
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
    return;
  }
  if (href.kind === 'anchor' && href.value) {
    element.setAttribute('href', '#');
    data.set('anchor', href.value);
  } else if (href.kind === 'internal' && href.value) {
    element.setAttribute('href', `#/read/${branch}/${href.value}`);
    data.set('internal', href.value);
  } else if (href.kind === 'series' && href.seriesId) {
    element.setAttribute('href', `#/browse?series=${href.seriesId}`);
  } else if (href.kind === 'external' && href.value) {
    element.setAttribute('href', href.value);
    element.setAttribute('target', '_blank');
    element.setAttribute('rel', 'noopener noreferrer');
    data.set('external', '1');
  }

  for (const [name, value] of data) element.setAttribute(`data-${name}`, value);
}

function collectToc(content: DocumentFragment): TocItem[] {
  const toc: TocItem[] = [];
  const used = new Set<string>();
  const headings = Array.from(content.querySelectorAll('h1, h2, h3, h4'));

  headings.forEach((heading, index) => {
    const text = (heading.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    let id = heading.id || `sec-${index + 1}`;
    id = sanitiseId(id).replace(/[^\w\u3400-\u9fff.:-]/g, '-') || `sec-${index + 1}`;
    if (used.has(id)) id = `${id}-${index + 1}`;
    used.add(id);
    heading.id = id;
    toc.push({ id, text: text.slice(0, 120), level: Number(heading.tagName[1]) });
  });
  return toc;
}

function wrapTables(content: DocumentFragment): void {
  for (const table of Array.from(content.querySelectorAll('table'))) {
    const parent = table.parentElement;
    if (parent?.classList.contains('table-wrap')) continue;
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrap';
    table.replaceWith(wrapper);
    wrapper.appendChild(table);
  }
}

export interface SanitizedArticle {
  html: string;
  toc: TocItem[];
  minutes: number;
}

export function sanitizeArticle(rawHtml: string, branch: Branch): SanitizedArticle {
  const template = document.createElement('template');
  template.innerHTML = rawHtml;
  const content = template.content;

  for (const node of Array.from(content.querySelectorAll(DROP_SELECTORS))) {
    node.remove();
  }

  const elements = Array.from(content.querySelectorAll('*'));
  for (const element of elements) {
    if (!element.parentNode) continue;
    const tag = element.tagName.toLowerCase();

    if (DROP_TAGS.has(tag)) {
      element.remove();
      continue;
    }

    if (!ALLOWED_TAGS.has(tag)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }

    rebuildAttributes(element, branch);
  }

  wrapTables(content);
  const toc = collectToc(content);

  return {
    html: template.innerHTML,
    toc,
    minutes: readingMinutes(template.innerHTML),
  };
}
