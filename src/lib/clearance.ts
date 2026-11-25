import type { Article, Clearance } from './types';

export interface ClearanceDef {
  id: Clearance;
  rank: number;
  badge: string;
  label: string;
  name: string;
  description: string;
  scope: string;
}

/**
 * The order is intentionally highest → lowest: this is how the picker reads,
 * and how a Foundation personnel file would be sorted.
 */
export const CLEARANCE_ORDER: Clearance[] = ['o5', 'l4', 'l3', 'l2', 'l1', 'd'];

export const CLEARANCES: Record<Clearance, ClearanceDef> = {
  o5: {
    id: 'o5',
    rank: 5,
    badge: 'O5',
    label: 'O5 议会',
    name: 'O5 议会成员',
    description: '基金会最高决策层，可查阅全部保留档案。',
    scope: '全部档案 · O5 保留条目 · 特遣队行动记录',
  },
  l4: {
    id: 'l4',
    rank: 4,
    badge: '4',
    label: '4 级',
    name: '四级人员',
    description: '站点主管与高级研究员，可接触 Keter 级项目。',
    scope: 'Keter 及以下 · 特遣队档案 · O5 条目脱敏',
  },
  l3: {
    id: 'l3',
    rank: 3,
    badge: '3',
    label: '3 级',
    name: '三级人员',
    description: '受信任的研究与安保人员，可接触 Euclid 级项目。',
    scope: 'Euclid 及以下 · 特遣队仅名录 · Keter 以上脱敏',
  },
  l2: {
    id: 'l2',
    rank: 2,
    badge: '2',
    label: '2 级',
    name: '二级人员',
    description: '一般研究人员与技术人员，可接触 Safe 级项目。',
    scope: 'Safe / Euclid · 特遣队无权限 · Keter 以上脱敏',
  },
  l1: {
    id: 'l1',
    rank: 1,
    badge: '1',
    label: '1 级',
    name: '一级人员',
    description: '基础勤务人员，仅可接触公开与 Safe 级资料。',
    scope: '公开资料 · 高等级档案大幅脱敏 · 无特遣队权限',
  },
  d: {
    id: 'd',
    rank: 0,
    badge: 'D',
    label: 'D 级人员',
    name: 'D 级人员',
    description: '消耗性人员，仅保留最低限度的阅读权限。',
    scope: '基础条目 · 绝大部分正文脱敏 · 无特遣队权限',
  },
};

export function isClearance(value: unknown): value is Clearance {
  return typeof value === 'string' && value in CLEARANCES;
}

export function clearanceRank(clearance: Clearance): number {
  return CLEARANCES[clearance].rank;
}

/** Whether the clearance can open the special forces section at all. */
export function canAccessTaskforces(clearance: Clearance): boolean {
  return clearanceRank(clearance) >= 3;
}

/** L3 sees the roster, L4/O5 see the operational details. */
export function taskforceAccess(clearance: Clearance): 'full' | 'roster' | 'none' {
  if (clearanceRank(clearance) >= 4) return 'full';
  if (clearanceRank(clearance) >= 3) return 'roster';
  return 'none';
}

export interface ArticleSecurity {
  required: Clearance;
  reason: string;
}

const CLASS_ORDER: Array<{ tag: string; clearance: Clearance; label: string }> = [
  { tag: 'apollyon', clearance: 'o5', label: 'Apollyon 级项目' },
  { tag: 'thaumiel', clearance: 'o5', label: 'Thaumiel 级项目' },
  { tag: 'keter', clearance: 'l4', label: 'Keter 级项目' },
  { tag: 'euclid', clearance: 'l3', label: 'Euclid 级项目' },
  { tag: 'safe', clearance: 'l2', label: 'Safe 级项目' },
];

/**
 * A deliberately simple in-universe classification. It is not a security
 * boundary: the UI is a reading experience, not an access-control system.
 */
export function articleSecurity(article: Pick<Article, 'code' | 'tags'>): ArticleSecurity {
  const code = article.code.toUpperCase();
  const tags = article.tags.map((tag) => tag.toLowerCase());

  if (code === 'SCP-001' || code === 'SCP-CN-001') {
    return { required: 'o5', reason: 'O5 保留档案' };
  }
  if (tags.includes('o5') || tags.includes('001-proposal')) {
    return { required: 'o5', reason: 'O5 保留档案' };
  }

  for (const item of CLASS_ORDER) {
    if (tags.includes(item.tag)) {
      return { required: item.clearance, reason: item.label };
    }
  }

  return { required: 'l1', reason: '未标注项目等级' };
}

export interface RedactionResult {
  html: string;
  redacted: number;
  total: number;
  ratio: number;
}

/**
 * Wraps selected text nodes in `.redaction` spans. The source HTML is already
 * sanitised; this pass only adds presentation, never new links or scripts.
 */
export function redactArticleHtml(
  html: string,
  current: Clearance,
  required: Clearance,
  reason: string,
): RedactionResult {
  const gap = clearanceRank(required) - clearanceRank(current);
  if (gap <= 0) return { html, redacted: 0, total: 0, ratio: 0 };

  const ratio = gap >= 4 ? 0.9 : gap === 3 ? 0.75 : gap === 2 ? 0.5 : 0.25;
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return { html, redacted: 0, total: 0, ratio };

  const blocks = Array.from(root.querySelectorAll('p, li, blockquote, td, dd')).filter(
    (block) => !block.closest('.scp-image-block') && (block.textContent ?? '').trim().length >= 24,
  );

  let redacted = 0;
  let total = 0;

  blocks.forEach((block, index) => {
    if (ratio < 0.85) {
      const selected =
        ratio >= 0.6 ? index % 4 !== 0 : ratio >= 0.4 ? index % 2 === 0 : index % 4 === 0;
      if (!selected) return;
    }

    const walker = doc.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let node = walker.nextNode();
    while (node) {
      if (node instanceof Text && (node.data ?? '').trim().length >= 4) nodes.push(node);
      node = walker.nextNode();
    }

    nodes.forEach((textNode) => {
      total += 1;
      if (!textNode.parentElement || textNode.parentElement.closest('.redaction')) return;
      const span = doc.createElement('span');
      span.className = 'redaction';
      span.dataset.required = required;
      span.title = `需要 ${CLEARANCES[required].badge} 级权限 · ${reason}`;
      span.setAttribute('aria-label', '内容已脱敏');
      span.textContent = textNode.data;
      textNode.parentNode?.replaceChild(span, textNode);
      redacted += 1;
    });
  });

  return { html: root.innerHTML, redacted, total, ratio };
}
