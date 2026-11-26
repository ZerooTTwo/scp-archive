import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EntryRow } from '../components/EntryRow';
import { Icon } from '../components/Icon';
import {
  Button,
  Dialog,
  EmptyState,
  Segmented,
  TopBar,
} from '../components/ui';
import { formatBytes, formatNumber } from '../lib/format';
import { useDocumentTitle } from '../lib/hooks';
import { useLibrary } from '../state/library';
import { useToast } from '../state/toast';

type Tab = 'favorites' | 'history' | 'offline';

export function Library() {
  useDocumentTitle('收藏与离线');
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const {
    favorites,
    history,
    offline,
    offlineKeys,
    progressMap,
    removeFavorite,
    clearHistory,
    removeOfflineArticle,
    clearOfflineLibrary,
  } = useLibrary();

  const rawTab = params.get('tab');
  const tab: Tab = rawTab === 'history' || rawTab === 'offline' ? rawTab : 'favorites';
  const [confirm, setConfirm] = useState<'history' | 'offline' | null>(null);

  const offlineBytes = useMemo(
    () => offline.reduce((sum, item) => sum + item.bytes, 0),
    [offline],
  );

  const setTab = (next: Tab) => {
    const paramsNext = new URLSearchParams(params);
    paramsNext.set('tab', next);
    setParams(paramsNext, { replace: true });
  };

  const stats: Array<{ id: Tab; label: string; value: string; icon: 'bookmark' | 'history' | 'download' }> = [
    { id: 'favorites', label: '收藏', value: formatNumber(favorites.length), icon: 'bookmark' },
    { id: 'history', label: '阅读记录', value: formatNumber(history.length), icon: 'history' },
    { id: 'offline', label: '离线正文', value: formatBytes(offlineBytes), icon: 'download' },
  ];

  return (
    <div className="page library-page">
      <TopBar
        title="收藏与离线"
        subtitle={offline.length ? `${offline.length} 篇正文已保存 · ${formatBytes(offlineBytes)}` : '本地优先，断网可读'}
      />

      <div className="library-stats">
        {stats.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`stat-card${tab === item.id ? ' is-active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            <span className="stat-card__icon">
              <Icon name={item.icon} size={18} />
            </span>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="library-tabs">
        <Segmented
          ariaLabel="收藏、历史与离线"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'favorites', label: '收藏' },
            { value: 'history', label: '历史' },
            { value: 'offline', label: '离线' },
          ]}
        />
      </div>

      {tab === 'favorites' ? (
        favorites.length ? (
          <div className="list list--entries">
            {favorites.map((item) => {
              const key = `${item.branch}:${item.slug}`;
              return (
                <EntryRow
                  key={key}
                  entry={item}
                  showBranch
                  cached={offlineKeys.has(key)}
                  progress={progressMap.get(key)}
                  onRemove={() => removeFavorite(item)}
                  removeIcon="bookmark-filled"
                  removeLabel="取消收藏"
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="bookmark"
            title="还没有收藏"
            description="在阅读页点击书签图标即可收藏；收藏时正文会自动下载，之后断网也能打开。"
            action={<Button onClick={() => navigate('/browse')}>去档案库看看</Button>}
          />
        )
      ) : null}

      {tab === 'history' ? (
        history.length ? (
          <>
            <div className="list-toolbar">
              <span>{formatNumber(history.length)} 条阅读记录</span>
              <Button variant="text" icon="trash" onClick={() => setConfirm('history')}>
                清除记录
              </Button>
            </div>
            <div className="list list--entries">
              {history.map((item) => {
                const key = `${item.branch}:${item.slug}`;
                return (
                  <EntryRow
                    key={key}
                    entry={item}
                    showBranch
                    cached={offlineKeys.has(key)}
                    progress={item.percent}
                  />
                );
              })}
            </div>
          </>
        ) : (
          <EmptyState
            icon="history"
            title="还没有阅读记录"
            description="打开任意档案，阅读进度会自动保存在本机，下次可以从停下的位置继续。"
            action={<Button onClick={() => navigate('/browse')}>开始阅读</Button>}
          />
        )
      ) : null}

      {tab === 'offline' ? (
        offline.length ? (
          <>
            <div className="list-toolbar">
              <span>
                {offline.length} 篇 · {formatBytes(offlineBytes)}
              </span>
              <Button variant="text" icon="trash" onClick={() => setConfirm('offline')}>
                清空离线
              </Button>
            </div>
            <div className="list list--entries">
              {offline.map((item) => {
                const key = `${item.branch}:${item.slug}`;
                return (
                  <EntryRow
                    key={key}
                    entry={item}
                    showBranch
                    cached
                    progress={progressMap.get(key)}
                    onRemove={() => {
                      void removeOfflineArticle(item.branch, item.slug).then(() => {
                        toast('已删除离线正文', { duration: 1800 });
                      });
                    }}
                    removeIcon="trash"
                    removeLabel="删除离线正文"
                  />
                );
              })}
            </div>
            <p className="list-end">离线正文上限 300 篇，超出后会自动淘汰最早缓存的内容。</p>
          </>
        ) : (
          <EmptyState
            icon="download"
            title="离线库是空的"
            description="阅读过的正文会自动保存到本机；收藏条目时也会立即下载正文。"
            action={<Button onClick={() => navigate('/browse')}>去缓存第一篇</Button>}
          />
        )
      ) : null}

      <Dialog
        open={confirm === 'history'}
        title="清除全部阅读记录？"
        description="这会删除本机的阅读进度，但不会删除收藏和离线正文。"
        confirmLabel="清除"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          void clearHistory().then(() => toast('阅读记录已清除'));
        }}
      />

      <Dialog
        open={confirm === 'offline'}
        title="清空离线正文？"
        description={`将删除 ${offline.length} 篇已缓存的正文（${formatBytes(offlineBytes)}）。收藏记录会保留。`}
        confirmLabel="清空"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          void clearOfflineLibrary().then(() => toast('离线正文已清空'));
        }}
      />
    </div>
  );
}
