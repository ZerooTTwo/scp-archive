import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EntryRow } from '../components/EntryRow';
import { Icon } from '../components/Icon';
import {
  Button,
  Chip,
  EmptyState,
  Segmented,
  Skeleton,
  TextField,
  TopBar,
} from '../components/ui';
import { BRANCH_LABEL } from '../lib/constants';
import { formatNumber } from '../lib/format';
import { useDebouncedValue, useDocumentTitle } from '../lib/hooks';
import type { Branch, Entry } from '../lib/types';
import { useCatalog } from '../state/catalog';
import { useLibrary } from '../state/library';

const PAGE_SIZE = 100;

type Scope = 'all' | Branch;

function rank(entry: Entry, needle: string): number {
  const code = entry.code.toLowerCase();
  const title = entry.title.toLowerCase();
  if (code === needle) return 0;
  if (code.startsWith(needle)) return 1;
  if (code.includes(needle)) return 2;
  if (title.startsWith(needle)) return 3;
  return 4;
}

export function Search() {
  useDocumentTitle('搜索');
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { entries, loading, total } = useCatalog();
  const { progressMap, offlineKeys } = useLibrary();

  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const [scope, setScope] = useState<Scope>('all');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const debounced = useDebouncedValue(query, 220);
  const needle = debounced.trim().toLowerCase();

  useEffect(() => {
    const next = new URLSearchParams(params);
    const current = next.get('q') ?? '';
    if (current === debounced.trim()) return;
    if (debounced.trim()) next.set('q', debounced.trim());
    else next.delete('q');
    setParams(next, { replace: true });
  }, [debounced, params, setParams]);

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [needle, scope]);

  const results = useMemo(() => {
    if (!needle) return [];
    const matches = entries.filter((entry) => {
      if (scope !== 'all' && entry.branch !== scope) return false;
      return (
        entry.code.toLowerCase().includes(needle) ||
        entry.title.toLowerCase().includes(needle)
      );
    });
    return matches
      .map((entry) => ({ entry, score: rank(entry, needle) }))
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return a.entry.code.localeCompare(b.entry.code, undefined, { numeric: true });
      })
      .map((item) => item.entry);
  }, [entries, needle, scope]);

  const visible = results.slice(0, limit);

  return (
    <div className="page search-page">
      <TopBar
        title="搜索"
        subtitle={loading ? '正在载入目录' : `${formatNumber(total)} 条可检索档案`}
        onBack={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
      />

      <div className="search-hero">
        <h1 className="search-hero__title">检索档案</h1>
        <p className="search-hero__copy">支持编号、标题与关键词。输入即搜，结果按匹配度排序。</p>
        <TextField
          icon="search"
          value={query}
          onChange={setQuery}
          placeholder="SCP-173 / 雕像 / 等待解密"
          aria-label="搜索档案"
          autoFocus
          autoComplete="off"
          spellCheck={false}
          onClear={() => setQuery('')}
        />
        <Segmented
          ariaLabel="搜索范围"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'all', label: '全部' },
            { value: 'cn', label: BRANCH_LABEL.cn },
            { value: 'en', label: BRANCH_LABEL.en },
          ]}
        />
      </div>

      {!needle ? (
        <div className="search-idle">
          <section className="section">
            <h2 className="search-idle__heading">试试这些</h2>
            <div className="chip-row">
              {['SCP-173', 'SCP-682', 'SCP-5000', 'SCP-CN-001', 'SCP-9999'].map((code) => (
                <Chip key={code} icon="hash" onClick={() => setQuery(code)}>
                  {code}
                </Chip>
              ))}
            </div>
          </section>
          <section className="section">
            <h2 className="search-idle__heading">没有头绪？</h2>
            <div className="search-actions">
              <button type="button" className="action-tile" onClick={() => navigate('/browse')}>
                <span className="action-tile__icon">
                  <Icon name="grid" size={22} />
                </span>
                <span>
                  <strong>按系列浏览</strong>
                  <small>从中分或英总系列目录进入</small>
                </span>
                <Icon name="chevron-right" size={18} />
              </button>
              <button type="button" className="action-tile" onClick={() => navigate('/library?tab=history')}>
                <span className="action-tile__icon">
                  <Icon name="history" size={22} />
                </span>
                <span>
                  <strong>从阅读记录继续</strong>
                  <small>回到上次停下的段落</small>
                </span>
                <Icon name="chevron-right" size={18} />
              </button>
            </div>
          </section>
        </div>
      ) : loading ? (
        <div className="list">
          <Skeleton lines={2} />
          <Skeleton lines={2} />
          <Skeleton lines={2} />
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon="search"
          title="没有匹配的档案"
          description={`没有找到与「${debounced.trim()}」相关的条目，试试编号或更短的关键词。`}
          action={
            <Button
              variant="tonal"
              onClick={() => {
                setQuery('');
                setScope('all');
              }}
            >
              清空搜索
            </Button>
          }
        />
      ) : (
        <>
          <div className="search-summary">
            <span>
              找到 <strong>{formatNumber(results.length)}</strong> 条
            </span>
            <span className="search-summary__hint">按匹配度排序</span>
          </div>
          <div className="list list--entries">
            {visible.map((entry) => {
              const key = `${entry.branch}:${entry.slug}`;
              return (
                <EntryRow
                  key={key}
                  entry={entry}
                  showBranch
                  query={debounced.trim()}
                  progress={progressMap.get(key)}
                  cached={offlineKeys.has(key)}
                />
              );
            })}
          </div>
          {visible.length < results.length ? (
            <div className="load-more">
              <Button variant="outline" onClick={() => setLimit((value) => value + PAGE_SIZE)}>
                加载更多（剩余 {formatNumber(results.length - visible.length)} 条）
              </Button>
            </div>
          ) : (
            <p className="list-end">已显示全部 {formatNumber(results.length)} 条结果</p>
          )}
        </>
      )}
    </div>
  );
}
