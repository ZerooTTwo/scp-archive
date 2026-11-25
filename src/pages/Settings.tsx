import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import {
  Button,
  Dialog,
  LinearProgress,
  Segmented,
  Slider,
  Switch,
  TopBar,
} from '../components/ui';
import {
  DEFAULT_SETTINGS,
  REPO_URL,
  WIKI_LICENSE_URL,
} from '../lib/constants';
import { clearAll } from '../lib/db';
import { formatBytes, formatNumber, relativeTime } from '../lib/format';
import { useDocumentTitle, useOnlineStatus } from '../lib/hooks';
import { useCatalog } from '../state/catalog';
import { useLibrary } from '../state/library';
import { useSettings } from '../state/settings';
import { useToast } from '../state/toast';

function SettingRow({
  title,
  description,
  children,
  stack,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  stack?: boolean;
}) {
  return (
    <div className={stack ? 'setting-row setting-row--stack' : 'setting-row'}>
      <div className="setting-row__text">
        <strong>{title}</strong>
        {description ? <span>{description}</span> : null}
      </div>
      {children ? <div className="setting-row__control">{children}</div> : null}
    </div>
  );
}

export function SettingsPage() {
  useDocumentTitle('设置');
  const navigate = useNavigate();
  const toast = useToast();
  const online = useOnlineStatus();
  const { settings, update, setTheme, setBranch } = useSettings();
  const { total, syncing, progress, lastSync, syncNow } = useCatalog();
  const {
    favorites,
    history,
    offline,
    offlineKeys,
    clearHistory,
    clearOfflineLibrary,
  } = useLibrary();
  const [confirm, setConfirm] = useState<'history' | 'offline' | 'all' | null>(null);

  const offlineBytes = offline.reduce((sum, item) => sum + item.bytes, 0);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <div className="page settings-page">
      <TopBar title="设置" subtitle="外观、数据与关于" onBack={goBack} />

      <section className="settings-group">
        <h2 className="settings-group__title">外观</h2>
        <div className="settings-card">
          <SettingRow title="主题" description="跟随系统或固定为暖纸色 / 暗色" stack>
            <Segmented
              ariaLabel="主题"
              value={settings.theme}
              onChange={setTheme}
              options={[
                { value: 'system', label: '跟随系统', icon: 'auto' },
                { value: 'light', label: '浅色', icon: 'sun' },
                { value: 'dark', label: '深色', icon: 'moon' },
              ]}
            />
          </SettingRow>

          <div className="setting-divider" />

          <SettingRow title="正文字号" description="仅影响阅读页的正文大小" stack>
            <Slider
              label="字号"
              value={settings.fontScale}
              min={0.85}
              max={1.3}
              step={0.05}
              display={`${Math.round(settings.fontScale * 100)}%`}
              onChange={(fontScale) => update({ fontScale })}
            />
          </SettingRow>

          <div className="setting-divider" />

          <SettingRow title="行高" description="更大的行距适合长文阅读" stack>
            <Slider
              label="行高"
              value={settings.lineHeight}
              min={1.6}
              max={2.2}
              step={0.05}
              display={settings.lineHeight.toFixed(2)}
              onChange={(lineHeight) => update({ lineHeight })}
            />
          </SettingRow>

          <div className="setting-divider" />

          <SettingRow title="衬线正文" description="使用宋体 / 衬线字体显示正文">
            <Switch
              label="衬线正文"
              checked={settings.serif}
              onChange={(serif) => update({ serif })}
            />
          </SettingRow>

          <div className="reader-preview" style={{ lineHeight: settings.lineHeight }}>
            <span className="reader-preview__label">预览</span>
            <p
              style={{
                fontSize: `${settings.fontScale}rem`,
                fontFamily: settings.serif
                  ? 'var(--font-serif)'
                  : 'var(--font-reading)',
              }}
            >
              项目编号：SCP-173。收容等级：Euclid。阅读时，文字应当像档案一样安静。
            </p>
          </div>
        </div>
      </section>

      <section className="settings-group">
        <h2 className="settings-group__title">内容</h2>
        <div className="settings-card">
          <SettingRow title="默认分部" description="首页与档案库优先显示的分部" stack>
            <Segmented
              ariaLabel="默认分部"
              value={settings.branch}
              onChange={setBranch}
              options={[
                { value: 'cn', label: '中文分部' },
                { value: 'en', label: '英文总部' },
              ]}
            />
          </SettingRow>
          <div className="setting-divider" />
          <SettingRow
            title="目录同步"
            description={
              syncing
                ? progress?.label ?? '正在同步'
                : `${formatNumber(total)} 条 · ${lastSync ? `${relativeTime(lastSync)}更新` : '尚未同步'}`
            }
          >
            <Button
              variant="tonal"
              icon="refresh"
              disabled={syncing || !online}
              onClick={() => void syncNow()}
            >
              {syncing ? '同步中' : '立即同步'}
            </Button>
          </SettingRow>
          {syncing ? (
            <div className="settings-progress">
              <LinearProgress
                value={progress ? (progress.done / Math.max(1, progress.total)) * 100 : 0}
              />
              <span>
                {progress?.done ?? 0} / {progress?.total ?? 15}
              </span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="settings-group">
        <h2 className="settings-group__title">本地数据</h2>
        <div className="settings-card">
          <SettingRow
            title="阅读记录"
            description={`${formatNumber(history.length)} 条进度记录`}
          >
            <Button
              variant="text"
              disabled={!history.length}
              onClick={() => setConfirm('history')}
            >
              清除
            </Button>
          </SettingRow>
          <div className="setting-divider" />
          <SettingRow
            title="离线正文"
            description={`${offline.length} 篇 · ${formatBytes(offlineBytes)}`}
          >
            <Button
              variant="text"
              disabled={!offline.length}
              onClick={() => setConfirm('offline')}
            >
              清空
            </Button>
          </SettingRow>
          <div className="setting-divider" />
          <SettingRow
            title="收藏"
            description={`${formatNumber(favorites.length)} 条收藏记录`}
          >
            <Button variant="text" onClick={() => navigate('/library?tab=favorites')}>
              查看
            </Button>
          </SettingRow>
          <div className="setting-divider" />
          <SettingRow
            title="清除全部本地数据"
            description="目录、正文、收藏、进度与偏好都会被删除"
          >
            <Button variant="danger" onClick={() => setConfirm('all')}>
              清除
            </Button>
          </SettingRow>
        </div>
        <p className="settings-hint">
          离线正文最多保留 300 篇（当前 {offlineKeys.size}），超出后自动淘汰最早缓存的内容。
        </p>
      </section>

      <section className="settings-group">
        <h2 className="settings-group__title">关于</h2>
        <div className="settings-card">
          <SettingRow title="SCP Archive" description="版本 0.1.0 · Capacitor + React">
            <Button variant="text" onClick={() => update(DEFAULT_SETTINGS)}>
              恢复默认
            </Button>
          </SettingRow>
          <div className="setting-divider" />
          <a className="setting-link" href={REPO_URL} target="_blank" rel="noopener noreferrer">
            <span className="setting-link__icon">
              <Icon name="external" size={19} />
            </span>
            <span>
              <strong>开源仓库</strong>
              <small>在 GitHub 查看源码与构建说明</small>
            </span>
            <Icon name="chevron-right" size={18} />
          </a>
          <a
            className="setting-link"
            href={WIKI_LICENSE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="setting-link__icon">
              <Icon name="file" size={19} />
            </span>
            <span>
              <strong>内容许可</strong>
              <small>SCP Wiki 内容遵循 CC BY-SA 3.0</small>
            </span>
            <Icon name="chevron-right" size={18} />
          </a>
        </div>
        <div className="settings-about">
          <p>
            本应用是非官方、开源的 SCP 阅读器，与 SCP 基金会无隶属关系。所有故事、标题与图片版权归
            原作者及 SCP Wiki 所有。
          </p>
          <p>目录全量内置；正文按需抓取并保存在本机，因此首次阅读需要联网。</p>
        </div>
      </section>

      <Dialog
        open={confirm === 'history'}
        title="清除阅读记录？"
        description="阅读进度将被删除，收藏与离线正文不受影响。"
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
        description={`将删除 ${offline.length} 篇正文（${formatBytes(offlineBytes)}），收藏记录保留。`}
        confirmLabel="清空"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          void clearOfflineLibrary().then(() => toast('离线正文已清空'));
        }}
      />
      <Dialog
        open={confirm === 'all'}
        title="清除全部本地数据？"
        description="这会删除目录缓存、离线正文、收藏、阅读进度和偏好设置，然后重新载入内置目录。"
        confirmLabel="全部清除"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          void clearAll().then(() => {
            try {
              localStorage.removeItem('scp-theme');
            } catch {
              // ignore
            }
            window.location.hash = '#/';
            window.location.reload();
          });
        }}
      />
    </div>
  );
}
