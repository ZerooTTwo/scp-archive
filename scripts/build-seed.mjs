import fs from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';

/**
 * Builds the bundled catalog snapshot (public/seed/catalog.json).
 *
 * Why bundle a snapshot?
 *  - First launch works offline and is instant (no waiting for 25 wiki pages).
 *  - The app can then run an incremental sync against the live wiki and only
 *    surface genuinely new entries.
 *
 * Run with: npm run seed
 */
const BRANCHES = {
  cn: {
    base: 'https://scp-wiki-cn.wikidot.com',
    label: 'CN',
    series: [
      { id: 'cn-t1', page: 'scp-series', range: '001 – 999', source: 'translated' },
      { id: 'cn-t2', page: 'scp-series-2', range: '1000 – 1999', source: 'translated' },
      { id: 'cn-t3', page: 'scp-series-3', range: '2000 – 2999', source: 'translated' },
      { id: 'cn-t4', page: 'scp-series-4', range: '3000 – 3999', source: 'translated' },
      { id: 'cn-t5', page: 'scp-series-5', range: '4000 – 4999', source: 'translated' },
      { id: 'cn-t6', page: 'scp-series-6', range: '5000 – 5999', source: 'translated' },
      { id: 'cn-t7', page: 'scp-series-7', range: '6000 – 6999', source: 'translated' },
      { id: 'cn-t8', page: 'scp-series-8', range: '7000 – 7999', source: 'translated' },
      { id: 'cn-t9', page: 'scp-series-9', range: '8000 – 8999', source: 'translated' },
      { id: 'cn-t10', page: 'scp-series-10', range: '9000 – 9999', source: 'translated' },
      { id: 'cn-1', page: 'scp-series-cn', range: 'CN-001 – 999', source: 'original' },
      { id: 'cn-2', page: 'scp-series-cn-2', range: 'CN-1000 – 1999', source: 'original' },
      { id: 'cn-3', page: 'scp-series-cn-3', range: 'CN-2000 – 2999', source: 'original' },
      { id: 'cn-4', page: 'scp-series-cn-4', range: 'CN-3000 – 3999', source: 'original' },
      { id: 'cn-5', page: 'scp-series-cn-5', range: 'CN-4000 – 4999', source: 'original' },
    ],
  },
  en: {
    base: 'https://scp-wiki.wikidot.com',
    label: 'EN',
    series: [
      { id: 'en-1', page: 'scp-series', range: '001 – 999', source: 'original' },
      { id: 'en-2', page: 'scp-series-2', range: '1000 – 1999', source: 'original' },
      { id: 'en-3', page: 'scp-series-3', range: '2000 – 2999', source: 'original' },
      { id: 'en-4', page: 'scp-series-4', range: '3000 – 3999', source: 'original' },
      { id: 'en-5', page: 'scp-series-5', range: '4000 – 4999', source: 'original' },
      { id: 'en-6', page: 'scp-series-6', range: '5000 – 5999', source: 'original' },
      { id: 'en-7', page: 'scp-series-7', range: '6000 – 6999', source: 'original' },
      { id: 'en-8', page: 'scp-series-8', range: '7000 – 7999', source: 'original' },
      { id: 'en-9', page: 'scp-series-9', range: '8000 – 8999', source: 'original' },
      { id: 'en-10', page: 'scp-series-10', range: '9000 – 9999', source: 'original' },
    ],
  },
};

const UA = 'SCP-Archive-Builder/0.1 (open-source reader; catalog snapshot)';
const OUT = path.resolve('public/seed/catalog.json');

async function fetchHtml(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
    }
  }
  throw new Error('unreachable');
}

function parseSeries(html) {
  const { document } = parseHTML(html);
  const content = document.querySelector('#page-content');
  if (!content) throw new Error('无法解析系列目录');

  const items = [];
  const seen = new Set();

  for (const listItem of content.querySelectorAll('li')) {
    // Only the first link is the entry itself; later links in a title are
    // cross-references and must not become separate catalog entries.
    const anchor = listItem.querySelector(':scope > a[href]');
    if (!anchor) continue;
    const href = anchor.getAttribute('href') ?? '';
    const match = href.match(/^\/(scp-[a-z0-9-]+)\/?$/i);
    if (!match) continue;
    const slug = match[1].toLowerCase();
    const code = (anchor.textContent ?? '').replace(/\s+/g, ' ').trim().toUpperCase();
    if (!/^SCP-[A-Z0-9-]+$/.test(code)) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);

    let title = (listItem?.textContent ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(new RegExp(`^${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '')
      .replace(/^[\s\-–—:：|]+/, '')
      .trim();
    if (!title) title = code;

    items.push({ slug, code, title: title.slice(0, 200) });
  }
  return items;
}

async function mapLimit(items, limit, mapper) {
  const results = [];
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

async function main() {
  const jobs = [];
  for (const [branch, config] of Object.entries(BRANCHES)) {
    for (const series of config.series) {
      jobs.push({ branch, config, series });
    }
  }

  const results = await mapLimit(jobs, 3, async (job) => {
    const url = `${job.config.base}/${job.series.page}`;
    process.stdout.write(`→ ${job.series.id.padEnd(6)} ${url}\n`);
    const html = await fetchHtml(url);
    const items = parseSeries(html);
    process.stdout.write(`  ${items.length} entries\n`);
    return { ...job, items };
  });

  const entries = [];
  const counts = {};
  for (const result of results) {
    counts[result.series.id] = result.items.length;
    result.items.forEach((item, index) => {
      entries.push({
        branch: result.branch,
        slug: item.slug,
        code: item.code,
        title: item.title,
        seriesId: result.series.id,
        source: result.series.source,
        position: index,
        firstSeen: 0,
      });
    });
  }

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  const payload = {
    generatedAt: Date.now(),
    source: 'https://scp-wiki-cn.wikidot.com + https://scp-wiki.wikidot.com',
    counts,
    entries,
  };
  await fs.writeFile(OUT, JSON.stringify(payload), 'utf8');

  const size = (await fs.stat(OUT)).size;
  console.log('\nSeries counts:');
  console.table(counts);
  console.log(`Entries: ${entries.length}`);
  console.log(`Wrote ${OUT} (${(size / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch((error) => {
  console.error('\nSeed build failed:', error);
  process.exitCode = 1;
});
