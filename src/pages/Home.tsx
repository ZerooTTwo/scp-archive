import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EntryRow } from '../components/EntryRow';
import { Icon, Logo } from '../components/Icon';
import {
  Badge,
  Button,
  Fab,
  IconButton,
  LinearProgress,
  SectionHeader,
  Segmented,
  Skeleton,
} from '../components/ui';
import { randomEntry, sortEntries } from '../lib/catalog';
import { BRANCH_LABEL, SERIES, seriesForBranch } from '../lib/constants';
import { formatNumber, relativeTime } from '../lib/format';
import { useDocumentTitle, useOnlineStatus } from '../lib/hooks';
import type { Branch } from '../lib/types';
import { useCatalog } from '../state/catalog';
import { useLibrary } from '../state/library';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';

export function Home() {
  useDocumentTitle(null);
  const navigate = useNavigate();
  const toast = useToast();
  const online = useOnlineStatus();
  const { settings, setBranch } = useSettings();
  const { entries, counts, total, loading, syncing, progress, lastSync, newCount, syncNow } =
    useCatalog();
  const { history } = useLibrary();

  const branch = settings.branch;
  const series = useMemo(() => seriesForBranch(branch), [branch]);
  const seriesGroups =
    branch === 'cn'
      ? [
          {
            key: 'translated',
            title: '中文译文',
            hint: 'SCP-001 – 9999 · 10 卷',
            items: series.filter((item) => item.source === 'translated'),
          },
          {
            key: 'original',
            title: '中文原创',
            hint: 'SCP-CN-001 – 4999 · 5 卷',
            items: series.filter((item) => item.source === 'original'),
          },
        ]
      : [
          {
            key: 'original',
            title: '英文总部',
            hint: 'SCP-001 – 9999 · 10 卷',
            items: series,
          },
        ];

  const newEntries = useMemo(
    () => sortEntries(entries.filter((entry) => entry.firstSeen > 0)).slice(0, 4),
    [entries],
  );
  const recent = history.slice(0, 4);

  const goRandom = () => {
    const pick = randomEntry(entries);
    if (!pick) {
      toast('目录尚未载入，请稍后再试');
      return;
    }
    navigate(`/read/${pick.branch}/${pick.slug}`);
  };

  return (
    <div className="page home">
      <header className="home-head">
        <div className="brand">
          <Logo size={36} />
          <div className="brand__text">
            <span className="brand__name">SCP 档案库</span>
            <span className="brand__sub">基金会档案 · 离线阅读</span>
          </div>
        </div>
        <div className="home-head__actions">
          <IconButton icon="search" label="搜索档案" onClick={() => navigate('/search')} />
          <IconButton icon="settings" label="设置" onClick={() => navigate('/settings')} />
        </div>
      </header>

      <button
        type="button"
        className={`sync-strip${online ? '' : ' sync-strip--offline'}`}
        onClick={() => void syncNow()}
        disabled={syncing}
      >
        <Icon name={online ? (syncing ? 'refresh' : 'check') : 'cloud-off'} size={17} />
        <span className="sync-strip__text">
          {syncing
            ? progress?.label ?? '正在同步目录'
            : online
              ? total
                ? `全量目录 ${formatNumber(total)} 条 · ${lastSync ? `${relativeTime(lastSync)}同步` : '尚未同步'}`
                : '正在载入本地目录'
              : '离线模式 · 使用已缓存的档案'}
        </span>
        {syncing ? (
          <span className="sync-strip__progress">
            <LinearProgress
              value={progress ? (progress.done / Math.max(1, progress.total)) * 100 : 0}
            />
          </span>
        ) : (
          <span className="sync-strip__cta">{online ? '同步' : '离线'}</span>
        )}
      </button>

      <section className="hero">
        <div className="hero__grid" aria-hidden="true" />
        <div className="hero__kicker">
          <span className="hero__rule" />
          控制 · 收容 · 保护
        </div>
        <h1 className="hero__title">
          收录 <em>{loading ? '——' : formatNumber(total)}</em> 份档案
        </h1>
        <p className="hero__copy">
          中文分部与英文总部的全量目录，按系列与编号归档。正文在线阅读后自动离线保存，
          收藏即缓存，断网也能继续翻阅。
        </p>
        <div className="hero__actions">
          <Button icon="book" onClick={() => navigate('/browse')}>
            开始浏览
          </Button>
          <Button variant="tonal" icon="hash" onClick={() => navigate('/browse?focus=number')}>
            按编号查找
          </Button>
        </div>
        <div className="hero__stats">
          <span>
            <strong>{SERIES.length}</strong> 个系列
          </span>
          <span>
            <strong>{newCount}</strong> 条新档案
          </span>
          <span>
            <strong>{history.length}</strong> 条阅读记录
          </span>
        </div>
      </section>

      {recent.length ? (
        <section className="section">
          <SectionHeader
            title="继续阅读"
            actionLabel="全部记录"
            onAction={() => navigate('/library?tab=history')}
          />
          <div className="continue-row">
            {recent.map((item) => (
              <Link
                key={`${item.branch}:${item.slug}`}
                className="continue-card"
                to={`/read/${item.branch}/${item.slug}`}
              >
                <span className="continue-card__top">
                  <span className="continue-card__code">{item.code}</span>
                  <span className="continue-card__pct">{Math.round(item.percent)}%</span>
                </span>
                <span className="continue-card__title">{item.title}</span>
                <span className="continue-card__bar">
                  <span style={{ width: `${Math.max(3, item.percent)}%` }} />
                </span>
                <span className="continue-card__time">
                  <Icon name="history" size={13} /> {relativeTime(item.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section">
        <SectionHeader title="按系列浏览" hint="按分部切换，译文与原创分开归档" />
        <Segmented
          ariaLabel="选择分部"
          value={branch}
          onChange={(value: Branch) => setBranch(value)}
          options={[
            { value: 'cn', label: BRANCH_LABEL.cn },
            { value: 'en', label: BRANCH_LABEL.en },
          ]}
        />
        {seriesGroups.map((group) => (
          <div key={group.key} className="series-group">
            <div className="series-group__head">
              <strong>{group.title}</strong>
              <span>{group.hint}</span>
            </div>
            <div className="series-grid">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="series-card"
                  onClick={() => navigate(`/browse?branch=${item.branch}&series=${item.id}`)}
                >
                  <span className="series-card__roman">{item.roman}</span>
                  <span className="series-card__body">
                    <strong>{item.label}</strong>
                    <span>{item.range}</span>
                  </span>
                  <span className="series-card__count">
                    {loading ? '—' : formatNumber(counts[item.id] ?? 0)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {newEntries.length ? (
        <section className="section">
          <SectionHeader
            title="最近收录"
            hint="同步时发现的新条目"
            actionLabel="查看全部"
            onAction={() => navigate('/browse?new=1')}
          />
          <div className="list">
            {newEntries.map((entry) => (
              <EntryRow key={`${entry.branch}:${entry.slug}`} entry={entry} showBranch />
            ))}
          </div>
        </section>
      ) : null}

      <section className="section">
        <SectionHeader title="快速入口" hint="从编号直接开始" />
        <div className="chip-row">
          {['SCP-173', 'SCP-5000', 'SCP-CN-001', 'SCP-9999'].map((code) => (
            <button
              key={code}
              type="button"
              className="chip"
              onClick={() => navigate(`/search?q=${encodeURIComponent(code)}`)}
            >
              <Icon name="hash" size={14} />
              {code}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <section className="section">
          <Skeleton lines={3} />
        </section>
      ) : null}

      {!loading && !total ? (
        <section className="section">
          <div className="notice notice--warning">
            <Icon name="alert" size={18} />
            <div>
              <strong>本地目录为空</strong>
              <p>请联网后点击顶部「同步」，或重新安装应用以载入内置目录。</p>
            </div>
          </div>
        </section>
      ) : null}

      <footer className="home-footer">
        <div className="home-footer__brand">
          <Logo size={24} />
          <span>SCP 档案库 · 非官方阅读器</span>
        </div>
        <p>
          目录与正文来自 SCP Wiki，内容遵循 CC BY-SA 3.0 协议。本应用与 SCP 基金会无隶属关系。
        </p>
        <div className="home-footer__badges">
          <Badge tone="neutral">目录全量</Badge>
          <Badge tone="neutral">正文按需离线</Badge>
          <Badge tone="success">本地优先</Badge>
        </div>
      </footer>

      <Fab label="随机档案" onClick={goRandom} />
    </div>
  );
}
