import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Share } from '@capacitor/share';
import { Icon } from '../components/Icon';
import {
  Button,
  Chip,
  EmptyState,
  IconButton,
  Sheet,
  Skeleton,
  Slider,
  Switch,
  TopBar,
} from '../components/ui';
import { findEntry } from '../lib/catalog';
import {
  ARTICLE_TTL_MS,
  BRANCH_LABEL,
  SERIES_BY_ID,
} from '../lib/constants';
import { readArticle } from '../lib/db';
import { formatNumber } from '../lib/format';
import { isNative, lightHaptic, useDocumentTitle } from '../lib/hooks';
import { cacheArticle, getReadingProgress } from '../lib/library';
import type { Article, Branch, ProgressRecord, WikiErrorCode } from '../lib/types';
import { fetchArticle, isOnline, WikiError } from '../lib/wiki';
import { useCatalog } from '../state/catalog';
import { useLibrary } from '../state/library';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';

function toggleCollapse(from: Element): void {
  const block = from.closest('.collapsible-block');
  if (!block) return;
  const open = block.getAttribute('data-open') === 'true';
  block.setAttribute('data-open', open ? 'false' : 'true');
}

export function Reader() {
  const navigate = useNavigate();
  const toast = useToast();
  const params = useParams();
  const branch: Branch = params.branch === 'en' ? 'en' : 'cn';
  const slug = params.slug ?? '';
  const key = `${branch}:${slug}`;

  const { entries } = useCatalog();
  const {
    isFavorite,
    toggleFavorite,
    offlineKeys,
    removeOfflineArticle,
    refreshOffline,
    saveProgress,
  } = useLibrary();
  const { settings, update } = useSettings();

  const [article, setArticle] = useState<Article | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<WikiErrorCode>('network');
  const [percent, setPercent] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [textOpen, setTextOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [offlineBusy, setOfflineBusy] = useState(false);
  const [allTags, setAllTags] = useState(false);

  const savedRef = useRef<ProgressRecord | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const restoringRef = useRef(true);
  const restoredFor = useRef<string | null>(null);

  const entry = useMemo(() => findEntry(entries, branch, slug), [entries, branch, slug]);
  const displayTitle = article ? entry?.title?.trim() || article.title : '';
  const tagList = article ? article.tags.filter((tag) => !tag.startsWith('_')) : [];
  const shownTags = allTags ? tagList : tagList.slice(0, 7);
  useDocumentTitle(article ? `${article.code} · ${displayTitle}` : '阅读');
  const series = entry ? SERIES_BY_ID.get(entry.seriesId) : undefined;
  const favorite = isFavorite(branch, slug);
  const cached = offlineKeys.has(key);

  useEffect(() => {
    setAllTags(false);
  }, [branch, slug]);

  useEffect(() => {
    let cancelled = false;
    restoredFor.current = null;
    restoringRef.current = true;
    setStatus('loading');
    setError('');
    setArticle(null);
    setPercent(0);
    window.scrollTo({ top: 0, behavior: 'auto' });

    void (async () => {
      const [stored, saved] = await Promise.all([
        readArticle(branch, slug),
        getReadingProgress(branch, slug),
      ]);
      if (cancelled) return;

      savedRef.current = saved ?? null;
      progressRef.current = saved?.percent ?? 0;

      if (stored) {
        setArticle(stored);
        setStatus('ready');
        setPercent(saved?.percent ?? 0);
        if (isOnline() && Date.now() - stored.fetchedAt > ARTICLE_TTL_MS) {
          void (async () => {
            try {
              const fresh = await fetchArticle(branch, slug);
              if (cancelled) return;
              setArticle(fresh);
              await cacheArticle(fresh);
              if (!cancelled) await refreshOffline();
            } catch {
              // Keep the cached copy when a background refresh fails.
            }
          })();
        }
        return;
      }

      try {
        const fresh = await fetchArticle(branch, slug);
        if (cancelled) return;
        setArticle(fresh);
        setStatus('ready');
        void cacheArticle(fresh)
          .then(() => (cancelled ? undefined : refreshOffline()))
          .catch(() => undefined);
      } catch (loadError) {
        if (cancelled) return;
        restoringRef.current = false;
        setErrorCode(loadError instanceof WikiError ? loadError.code : 'network');
        setError(
          loadError instanceof Error ? loadError.message : '无法载入这篇档案，请检查网络后重试',
        );
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [branch, slug, reloadKey, refreshOffline]);

  useEffect(() => {
    if (status !== 'ready' || !article) return;
    const articleKey = `${branch}:${slug}`;
    if (restoredFor.current === articleKey) return;

    const saved = savedRef.current?.percent ?? 0;
    if (saved < 1) {
      restoringRef.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      restoredFor.current = articleKey;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: Math.max(0, (max * saved) / 100), behavior: 'auto' });
      setPercent(saved);
      window.setTimeout(() => {
        restoringRef.current = false;
      }, 320);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [status, article, branch, slug]);

  // Wikidot's image host occasionally drops the first request. Retry once,
  // without changing the visible figure, before giving up.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    const onError = (event: Event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement) || image.dataset.retried === '1') return;
      image.dataset.retried = '1';
      const source = image.src;
      window.setTimeout(() => {
        const separator = source.includes('?') ? '&' : '?';
        image.src = `${source}${separator}retry=1`;
      }, 650);
    };

    body.addEventListener('error', onError, true);
    return () => body.removeEventListener('error', onError, true);
  }, [article]);

  useEffect(() => {
    if (status !== 'ready' || !article) return;

    let frame = 0;
    let timer = 0;

    const save = () => {
      if (restoringRef.current) return;
      saveProgress({
        branch,
        slug,
        code: article.code,
        title: article.title,
        percent: Math.round(progressRef.current),
        updatedAt: Date.now(),
      });
    };

    const onScroll = () => {
      if (restoringRef.current || frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const next = max > 0 ? Math.max(0, Math.min(100, (window.scrollY / max) * 100)) : 0;
        progressRef.current = next;
        setPercent((current) => (Math.abs(current - next) >= 0.4 ? next : current));
        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(save, 900);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      if (timer) window.clearTimeout(timer);
      save();
    };
  }, [status, article, branch, slug, saveProgress]);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/browse');
  };

  const handleArticleClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const collapse = target.closest<HTMLElement>('[data-collapse]');
    if (collapse) {
      event.preventDefault();
      toggleCollapse(collapse);
      return;
    }

    const anchor = target.closest<HTMLAnchorElement>('a[data-anchor]');
    if (anchor) {
      event.preventDefault();
      const raw = anchor.dataset.anchor;
      if (!raw) return;
      let id = raw;
      try {
        id = decodeURIComponent(raw);
      } catch {
        // Keep the raw fragment when it is not valid percent-encoding.
      }
      const element = document.getElementById(id) ?? document.querySelector(`[name="${CSS.escape(id)}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleArticleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target as HTMLElement;
    const collapse = target.closest<HTMLElement>('[data-collapse]');
    if (!collapse) return;
    event.preventDefault();
    toggleCollapse(collapse);
  };

  const goToSection = (id: string) => {
    setTocOpen(false);
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  const shareArticle = async () => {
    if (!article) return;
    const url = window.location.href;
    const shareTitle = `${article.code} · ${article.title}`;
    try {
      if (isNative) {
        const { value } = await Share.canShare();
        if (value) {
          await Share.share({ title: shareTitle, text: 'SCP Archive', url, dialogTitle: '分享档案' });
          return;
        }
      }
    } catch {
      // Fall through to the web share sheet.
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
        return;
      } catch (shareError) {
        if ((shareError as Error).name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('链接已复制');
    } catch {
      toast('无法分享，请手动复制地址');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast('链接已复制');
    } catch {
      toast('复制失败，请手动选择地址栏');
    }
  };

  const toggleOffline = async () => {
    if (!article || offlineBusy) return;
    setOfflineBusy(true);
    try {
      if (cached) {
        await removeOfflineArticle(branch, slug);
        toast('已删除离线正文');
      } else {
        await cacheArticle(article);
        await refreshOffline();
        toast('已保存到离线');
      }
      setMoreOpen(false);
    } catch {
      toast('操作失败，请稍后再试');
    } finally {
      setOfflineBusy(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="page reader-page">
        <TopBar title="阅读" onBack={goBack} />
        <div className="reader-skeleton">
          <Skeleton lines={2} />
          <Skeleton lines={5} />
          <Skeleton lines={4} />
        </div>
      </div>
    );
  }

  if (status === 'error' || !article) {
    const notFound = errorCode === 'not-found';
    return (
      <div className="page reader-page">
        <TopBar title="阅读" onBack={goBack} />
        <EmptyState
          icon={notFound ? 'file' : 'cloud-off'}
          title={notFound ? '没有找到这篇档案' : '档案载入失败'}
          description={
            notFound
              ? '该编号可能不存在，或尚未被翻译到当前分部。可以回到档案库换一篇看看。'
              : error || '请检查网络连接后重试。已缓存的正文仍然可以离线阅读。'
          }
          action={
            <div className="reader-error__actions">
              <Button icon="refresh" onClick={() => setReloadKey((value) => value + 1)}>
                重试
              </Button>
              <Button variant="text" onClick={() => navigate('/browse')}>
                返回档案库
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="page reader-page">
      <div className="reader-topbar">
        <TopBar
          title={<span className="reader-topbar__code">{article.code}</span>}
          subtitle={displayTitle}
          onBack={goBack}
          actions={
            <>
              <IconButton
                icon={favorite ? 'bookmark-filled' : 'bookmark'}
                label={favorite ? '取消收藏' : '收藏'}
                selected={favorite}
                onClick={() => {
                  void lightHaptic();
                  toggleFavorite(article);
                }}
              />
              <IconButton icon="text" label="阅读设置" onClick={() => setTextOpen(true)} />
              <IconButton icon="more" label="更多操作" onClick={() => setMoreOpen(true)} />
            </>
          }
        />
        <div className="reader-progress" aria-hidden="true">
          <span style={{ width: `${percent}%` }} />
        </div>
      </div>

      <article className="reader">
        <header className="reader-head">
          <div className="reader-kicker">
            <Icon name="shield" size={13} />
            {BRANCH_LABEL[branch]}
            {series ? ` · ${series.label}` : ''}
          </div>
          <h1 className="reader-title">{displayTitle}</h1>
          <div className="reader-code">{article.code}</div>
          <div className="reader-meta">
            {article.rating !== null ? (
              <span
                className={`reader-rating${article.rating < 0 ? ' reader-rating--down' : ''}`}
                title="Wikidot 评分"
              >
                <span aria-hidden="true">{article.rating >= 0 ? '▲' : '▼'}</span>
                {article.rating > 0 ? '+' : ''}
                {formatNumber(article.rating)}
              </span>
            ) : null}
            <span>{article.minutes} 分钟</span>
            <span>{tagList.length} 个标签</span>
            {cached ? (
              <span className="reader-meta__cached">
                <Icon name="download-done" size={13} /> 已离线
              </span>
            ) : null}
          </div>
          {tagList.length ? (
            <div className="reader-tags">
              {shownTags.map((tag) => (
                <Chip
                  key={tag}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                >
                  {tag}
                </Chip>
              ))}
              {tagList.length > shownTags.length ? (
                <Chip onClick={() => setAllTags(true)}>+{tagList.length - shownTags.length}</Chip>
              ) : allTags && tagList.length > 7 ? (
                <Chip onClick={() => setAllTags(false)}>收起</Chip>
              ) : null}
            </div>
          ) : null}
        </header>

        {article.toc.length > 2 ? (
          <button type="button" className="toc-peek" onClick={() => setTocOpen(true)}>
            <Icon name="list" size={18} />
            <span>目录 · {article.toc.length} 节</span>
            <Icon name="chevron-right" size={17} />
          </button>
        ) : null}

        <div
          ref={bodyRef}
          className={`reader-body${settings.serif ? ' reader-body--serif' : ''}`}
          style={{ fontSize: `${settings.fontScale}rem`, lineHeight: settings.lineHeight }}
          onClick={handleArticleClick}
          onKeyDown={handleArticleKeyDown}
          dangerouslySetInnerHTML={{ __html: article.html }}
        />

        <footer className="reader-foot">
          <div className="reader-source">
            <p>
              正文来自 SCP Wiki
              {article.updated ? ` · ${article.updated}` : ''}
            </p>
            <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
              查看原文 <Icon name="external" size={14} />
            </a>
          </div>

          <nav className="reader-walk" aria-label="上一篇与下一篇">
            {article.prev ? (
              <Link className="reader-walk__item" to={`/read/${article.prev.branch}/${article.prev.slug}`}>
                <span className="reader-walk__dir">
                  <Icon name="arrow-left" size={14} /> 上一篇
                </span>
                <strong>{article.prev.code}</strong>
                {article.prev.title && article.prev.title !== article.prev.code ? (
                  <small>{article.prev.title}</small>
                ) : null}
              </Link>
            ) : (
              <span className="reader-walk__empty" />
            )}
            {article.next ? (
              <Link
                className="reader-walk__item reader-walk__item--next"
                to={`/read/${article.next.branch}/${article.next.slug}`}
              >
                <span className="reader-walk__dir">
                  下一篇 <Icon name="arrow-right" size={14} />
                </span>
                <strong>{article.next.code}</strong>
                {article.next.title && article.next.title !== article.next.code ? (
                  <small>{article.next.title}</small>
                ) : null}
              </Link>
            ) : (
              <span className="reader-walk__empty" />
            )}
          </nav>

          <div className="reader-cta">
            <Button
              variant={favorite ? 'tonal' : 'outline'}
              icon={favorite ? 'bookmark-filled' : 'bookmark'}
              onClick={() => {
                void lightHaptic();
                toggleFavorite(article);
              }}
            >
              {favorite ? '已收藏' : '收藏'}
            </Button>
            <Button
              variant="outline"
              icon={cached ? 'download-done' : 'download'}
              disabled={offlineBusy}
              onClick={() => void toggleOffline()}
            >
              {cached ? '已离线' : '保存离线'}
            </Button>
            <Button variant="text" icon="share" onClick={() => void shareArticle()}>
              分享
            </Button>
          </div>

          <p className="reader-license">
            本页内容遵循 CC BY-SA 3.0。SCP Archive 是非官方阅读器，与 SCP 基金会无隶属关系。
          </p>
        </footer>
      </article>

      <Sheet open={tocOpen} onClose={() => setTocOpen(false)} title="目录">
        {article.toc.length ? (
          <div className="toc-list">
            {article.toc.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`toc-item toc-item--h${item.level}`}
                onClick={() => goToSection(item.id)}
              >
                <span>{item.text}</span>
                <Icon name="chevron-right" size={15} />
              </button>
            ))}
          </div>
        ) : (
          <p className="sheet-empty">这篇档案没有分节标题。</p>
        )}
      </Sheet>

      <Sheet open={textOpen} onClose={() => setTextOpen(false)} title="阅读设置">
        <div className="sheet-stack">
          <Slider
            label="正文字号"
            value={settings.fontScale}
            min={0.85}
            max={1.3}
            step={0.05}
            display={`${Math.round(settings.fontScale * 100)}%`}
            onChange={(fontScale) => update({ fontScale })}
          />
          <Slider
            label="行高"
            value={settings.lineHeight}
            min={1.6}
            max={2.2}
            step={0.05}
            display={settings.lineHeight.toFixed(2)}
            onChange={(lineHeight) => update({ lineHeight })}
          />
          <div className="sheet-row">
            <div>
              <strong>衬线正文</strong>
              <span>使用宋体 / 衬线字体排版</span>
            </div>
            <Switch
              label="衬线正文"
              checked={settings.serif}
              onChange={(serif) => update({ serif })}
            />
          </div>
          <Button
            variant="outline"
            icon="rotate"
            onClick={() => update({ fontScale: 1, lineHeight: 1.9, serif: false })}
          >
            恢复默认排版
          </Button>
        </div>
      </Sheet>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="更多操作">
        <div className="sheet-list">
          <button type="button" className="sheet-list__item" onClick={() => void shareArticle()}>
            <Icon name="share" size={19} />
            <span>分享档案</span>
          </button>
          <button type="button" className="sheet-list__item" onClick={() => void copyLink()}>
            <Icon name="copy" size={19} />
            <span>复制链接</span>
          </button>
          <button
            type="button"
            className="sheet-list__item"
            disabled={offlineBusy}
            onClick={() => void toggleOffline()}
          >
            <Icon name={cached ? 'trash' : 'download'} size={19} />
            <span>{cached ? '删除离线正文' : '保存到离线'}</span>
          </button>
          <a
            className="sheet-list__item"
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="external" size={19} />
            <span>在浏览器打开原文</span>
          </a>
          <button
            type="button"
            className="sheet-list__item"
            onClick={() => {
              setMoreOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Icon name="arrow-up" size={19} />
            <span>回到顶部</span>
          </button>
        </div>
      </Sheet>
    </div>
  );
}
