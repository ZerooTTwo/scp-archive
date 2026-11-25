import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EntryRow } from '../components/EntryRow';
import { Icon } from '../components/Icon';
import {
  Button,
  Chip,
  EmptyState,
  IconButton,
  Segmented,
  Skeleton,
  TextField,
  TopBar,
} from '../components/ui';
import { sortEntries } from '../lib/catalog';
import { BRANCH_LABEL, SERIES_BY_ID, seriesForBranch } from '../lib/constants';
import { formatNumber } from '../lib/format';
import { useDocumentTitle } from '../lib/hooks';
import type { Branch } from '../lib/types';
import { useCatalog } from '../state/catalog';
import { useLibrary } from '../state/library';
import { useSettings } from '../state/settings';

const PAGE_SIZE = 200;

export function Browse() {
  useDocumentTitle('档案库');
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { settings, setBranch } = useSettings();
  const { entries, counts, loading, syncing, syncNow, error } = useCatalog();
  const { progressMap, offlineKeys } = useLibrary();

  const branchParam = params.get('branch');
  const branch: Branch =
    branchParam === 'en' || branchParam === 'cn' ? branchParam : settings.branch;
  const seriesParam = params.get('series');
  const seriesDef = seriesParam ? SERIES_BY_ID.get(seriesParam) : undefined;
  const activeSeries = seriesDef && seriesDef.branch === branch ? seriesDef.id : 'all';
  const onlyNew = params.get('new') === '1';
  const focusNumber = params.get('focus') === 'number';

  const [limit, setLimit] = useState(PAGE_SIZE);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [branch, activeSeries, onlyNew]);

  const filtered = useMemo(() => {
    let list = entries.filter((entry) => entry.branch === branch);
    if (activeSeries !== 'all') list = list.filter((entry) => entry.seriesId === activeSeries);
    if (onlyNew) list = list.filter((entry) => entry.firstSeen > 0);
    return sortEntries(list);
  }, [entries, branch, activeSeries, onlyNew]);

  const visible = filtered.slice(0, limit);
  const series = seriesForBranch(branch);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === 'branch') {
      next.delete('series');
      next.delete('new');
    }
    setParams(next, { replace: true });
  };

  const changeBranch = (value: Branch) => {
    setBranch(value);
    updateParam('branch', value);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    navigate(`/search?q=${encodeURIComponent(value)}`);
  };

  return (
    <div className="page browse">
      <TopBar
        title="档案库"
        subtitle={loading ? '正在载入目录' : `${formatNumber(filtered.length)} 条档案`}
        actions={
          <IconButton
            icon="refresh"
            label="同步目录"
            onClick={() => void syncNow()}
            disabled={syncing}
            className={syncing ? 'is-spinning' : undefined}
          />
        }
      />

      <div className="browse-filters">
        <Segmented
          ariaLabel="选择分部"
          value={branch}
          onChange={changeBranch}
          options={[
            { value: 'cn', label: BRANCH_LABEL.cn },
            { value: 'en', label: BRANCH_LABEL.en },
          ]}
        />

        <form onSubmit={submitSearch} className="browse-search">
          <TextField
            icon="search"
            value={query}
            onChange={setQuery}
            placeholder="输入编号或标题，回车搜索"
            aria-label="搜索档案"
            autoFocus={focusNumber}
            onClear={() => setQuery('')}
          />
          <Button type="submit" variant="tonal" icon="arrow-right">
            搜索
          </Button>
        </form>

        <div className="chip-scroll" role="group" aria-label="系列筛选">
          <Chip selected={activeSeries === 'all'} onClick={() => updateParam('series', null)}>
            全部
          </Chip>
          {series.map((item) => (
            <Chip
              key={item.id}
              selected={activeSeries === item.id}
              onClick={() => updateParam('series', item.id)}
            >
              {item.roman} · {formatNumber(counts[item.id] ?? 0)}
            </Chip>
          ))}
          <span className="chip-divider" />
          <Chip
            selected={onlyNew}
            icon="sparkles"
            onClick={() => updateParam('new', onlyNew ? null : '1')}
          >
            仅看新增
          </Chip>
        </div>
      </div>

      {error ? (
        <div className="notice notice--warning">
          <Icon name="alert" size={18} />
          <div>
            <strong>目录读取失败</strong>
            <p>{error}</p>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="list">
          <Skeleton lines={2} />
          <Skeleton lines={2} />
          <Skeleton lines={2} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={onlyNew ? 'sparkles' : 'folder'}
          title={onlyNew ? '还没有发现新档案' : '这个系列还没有条目'}
          description={onlyNew ? '下次同步发现新增条目时会出现在这里。' : '试试切换分部或选择其他系列。'}
          action={
            <Button
              variant="tonal"
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete('series');
                next.delete('new');
                setParams(next, { replace: true });
              }}
            >
              查看全部
            </Button>
          }
        />
      ) : (
        <>
          <div className="list list--entries">
            {visible.map((entry) => {
              const key = `${entry.branch}:${entry.slug}`;
              return (
                <EntryRow
                  key={key}
                  entry={entry}
                  showBranch={activeSeries === 'all'}
                  progress={progressMap.get(key)}
                  cached={offlineKeys.has(key)}
                />
              );
            })}
          </div>
          {visible.length < filtered.length ? (
            <div className="load-more">
              <Button variant="outline" onClick={() => setLimit((value) => value + PAGE_SIZE)}>
                加载更多（剩余 {formatNumber(filtered.length - visible.length)} 条）
              </Button>
            </div>
          ) : (
            <p className="list-end">已显示全部 {formatNumber(filtered.length)} 条档案</p>
          )}
        </>
      )}
    </div>
  );
}
