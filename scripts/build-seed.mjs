import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Builds the bundled catalog snapshot (public/seed/catalog.json).
 *
 * Why bundle a snapshot?
 *  - First launch works offline and is instant (no waiting for 15 wiki pages).
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
      { id: 'cn-1', page: 'scp-series-cn', range: '001 – 999' },
      { id: 'cn-2', page: 'scp-series-cn-2', range: '1000 – 1999' },
      { id: 'cn-3', page: 'scp-series-cn-3', range: '2000 – 2999' },
      { id: 'cn-4', page: 'scp-series-cn-4', range: '3000 – 3999' },
      { id: 'cn-5', page: 'scp-series-cn-5', range: '4000 – 4999' },
    ],
  },
  en: {
    base: 'https://scp-wiki.wikidot.com',
    label: 'EN',
    series: [
      { id: 'en-1', page: 'scp-series', range: '001 – 999' },
      { id: 'en-2', page: 'scp-series-2', range: '1000 – 1999' },
      { id: 'en-3', page: 'scp-series-3', range: '2000 – 2999' },
      { id: 'en-4', page: 'scp-series-4', range: '3000 – 3999' },
      { id: 'en-5', page: 'scp-series-5', range: '4000 – 4999' },
      { id: 'en-6', page: 'scp-series-6', range: '5000 – 5999' },
      { id: 'en-7', page: 'scp-series-7', range: '6000 – 6999' },
      { id: 'en-8', page: 'scp-series-8', range: '7000 – 7999' },
      { id: 'en-9', page: 'scp-series-9', range: '8000 – 8999' },
      { id: 'en-10', page: 'scp-series-10', range: '9000 – 9999' },
    ],
  },
};

const UA = 'SCP-Archive-Builder/0.1 (open-source reader; catalog snapshot)';
const OUT = path.resolve('public/seed/catalog.json');

function decodeEntities(input) {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&hellip;/gi, '…');
}

function stripTags(input) {
  return decodeEntities(input.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}

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

/** Cut the article body out of the full Wikidot page. */
function bodyOf(html) {
  const start = html.indexOf('id="page-content"');
  if (start < 0) return html;
  const end = html.indexOf('<div class="page-tags"', start);
  return end > start ? html.slice(start, end) : html.slice(start);
}

function parseSeries(html) {
  const body = bodyOf(html);
  const items = [];
  const seen = new Set();
  const re =
    /<li[^>]*>\s*<a\s+href="\/(scp-[a-z0-9-]+)"[^>]*>([\s\S]*?)<\/a>([\s\S]*?)<\/li>/gi;

  let match;
  while ((match = re.exec(body))) {
    const slug = match[1].toLowerCase();
    const code = stripTags(match[2]).toUpperCase();
    if (!/^SCP-[A-Z0-9-]+$/.test(code)) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);

    let title = stripTags(match[3]).replace(/^[\s\-–—:：|]+/, '');
    if (!title) title = code;
    items.push({ slug, code, title });
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
