import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import {
  Button,
  Chip,
  Dialog,
  LinearProgress,
  Segmented,
  Slider,
  Switch,
  TextField,
  TopBar,
} from '../components/ui';
import {
  CLEARANCE_ORDER,
  CLEARANCES,
  clearanceRank,
  taskforceAccess,
} from '../lib/clearance';
import {
  DEFAULT_SETTINGS,
  REPO_URL,
  WIKI_LICENSE_URL,
} from '../lib/constants';
import { clearAll } from '../lib/db';
import { formatBytes, formatNumber, relativeTime } from '../lib/format';
import { useDocumentTitle, useOnlineStatus } from '../lib/hooks';
import { testTranslation } from '../lib/translate';
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
  const [searchParams] = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    if (searchParams.get('focus') !== 'translation') return;
    const timer = window.setTimeout(() => {
      document.getElementById('translation')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [searchParams]);
  const online = useOnlineStatus();
  const { settings, update, setTheme, setClearance, setBranch } = useSettings();
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
  const [testing, setTesting] = useState(false);

  const offlineBytes = offline.reduce((sum, item) => sum + item.bytes, 0);
  const currentClearance = CLEARANCES[settings.clearance];
  const tfAccess = taskforceAccess(settings.clearance);
  const archiveAccess = clearanceRank(settings.clearance) >= 4 ? '完整正文' : '按等级脱敏';

  const setTranslation = (patch: Partial<typeof settings.translation>) => {
    update({ translation: { ...settings.translation, ...patch } });
  };

  const testApi = async () => {
    if (testing) return;
    setTesting(true);
    try {
      const sample = await testTranslation(settings.translation);
      toast(`连接成功：${sample.slice(0, 48)}${sample.length > 48 ? '…' : ''}`);
    } catch (error) {
      toast(error instanceof Error ? error.message : '连接失败');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="page settings-page">
      <TopBar title="设置" subtitle="权限、外观与数据" />

      <section className="settings-group settings-group--clearance" id="clearance">
        <h2 className="settings-group__title">
          人员等级 <span className="settings-group__aside">权限模拟</span>
        </h2>
        <div className="clearance-card">
          <div className="clearance-current">
            <span className={`clearance-seal clearance-seal--${currentClearance.id}`}>
              {currentClearance.badge}
            </span>
            <div className="clearance-current__text">
              <span className="clearance-current__eyebrow">当前权限凭证</span>
              <strong>{currentClearance.name}</strong>
              <p>{currentClearance.description}</p>
            </div>
          </div>

          <div className="clearance-traits" aria-label="当前权限范围">
            <span className="clearance-trait">
              <Icon name="folder" size={13} /> 档案库 · {archiveAccess}
            </span>
            <span className={`clearance-trait${tfAccess === 'none' ? ' is-locked' : ''}`}>
              <Icon name={tfAccess === 'none' ? 'lock' : 'shield'} size={13} />
              特遣队 · {tfAccess === 'full' ? '完整' : tfAccess === 'roster' ? '仅名录' : '锁定'}
            </span>
            <span className="clearance-trait">
              <Icon name="eye" size={13} /> 脱敏 · {currentClearance.badge} 级
            </span>
          </div>

          <div className="clearance-options" role="radiogroup" aria-label="选择人员等级">
            {CLEARANCE_ORDER.map((id) => {
              const item = CLEARANCES[id];
              const selected = id === settings.clearance;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`clearance-option${selected ? ' is-selected' : ''}`}
                  onClick={() => {
                    setClearance(id);
                    toast(`权限已切换为 ${item.name}`);
                  }}
                >
                  <span className={`clearance-option__badge clearance-seal--${id}`}>
                    {item.badge}
                  </span>
                  <span className="clearance-option__text">
                    <strong>{item.name}</strong>
                    <small>{item.scope}</small>
                  </span>
                  <span className="clearance-option__check" aria-hidden="true">
                    {selected ? <Icon name="check" size={17} /> : null}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="clearance-note">
            <Icon name="info" size={13} />
            这是阅读氛围设定：切换后配色、栏目与正文脱敏会立刻改变，不构成真实访问控制。
          </p>
        </div>
      </section>

      <section className="settings-group">
        <h2 className="settings-group__title">应用标志</h2>
        <div className="settings-card">
          <div className="icon-choice-grid" role="radiogroup" aria-label="应用标志">
            {(
              [
                { id: 'official', name: '官方标志', note: '基金会徽记' },
                { id: 'cn', name: '中国分部', note: '中分龙形标志' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={settings.appIcon === item.id}
                className={`icon-choice${settings.appIcon === item.id ? ' is-selected' : ''}`}
                onClick={() => update({ appIcon: item.id })}
              >
                <img src={`/icons/${item.id}/icon-192.png`} alt="" width={46} height={46} />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.note}</small>
                </span>
                {settings.appIcon === item.id ? <Icon name="check" size={16} /> : null}
              </button>
            ))}
          </div>
          <p className="settings-hint">
            应用内标志会立即切换；安卓桌面图标也会同步切换，部分启动器需要几秒刷新。网页版只切换应用内标志。
          </p>
        </div>
      </section>

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

      <section className="settings-group" id="translation">
        <h2 className="settings-group__title">
          翻译接口 <span className="settings-group__aside">OpenAI 兼容</span>
        </h2>
        <div className="settings-card">
          <div className="translation-presets">
            <Chip
              onClick={() =>
                setTranslation({
                  endpoint: 'https://api.deepseek.com/v1',
                  model: 'deepseek-chat',
                })
              }
            >
              DeepSeek
            </Chip>
            <Chip
              onClick={() =>
                setTranslation({
                  endpoint: 'https://api.openai.com/v1',
                  model: 'gpt-4o-mini',
                })
              }
            >
              OpenAI
            </Chip>
            <Chip
              onClick={() =>
                setTranslation({
                  endpoint: 'http://localhost:11434/v1',
                  model: 'qwen2.5:7b',
                })
              }
            >
              本地 Ollama
            </Chip>
          </div>

          <div className="translation-form">
            <label className="translation-field">
              <span>接口地址</span>
              <TextField
                value={settings.translation.endpoint}
                onChange={(endpoint) => setTranslation({ endpoint })}
                placeholder="https://api.deepseek.com/v1"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <label className="translation-field">
              <span>模型</span>
              <TextField
                value={settings.translation.model}
                onChange={(model) => setTranslation({ model })}
                placeholder="deepseek-chat"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <label className="translation-field">
              <span>API Key</span>
              <TextField
                value={settings.translation.apiKey}
                onChange={(apiKey) => setTranslation({ apiKey })}
                placeholder="sk-...（本地接口可留空）"
                type="password"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
          </div>

          <div className="translation-actions">
            <Button
              variant="tonal"
              icon="globe"
              disabled={testing || !settings.translation.endpoint.trim() || !settings.translation.model.trim()}
              onClick={() => void testApi()}
            >
              {testing ? '测试中…' : '测试连接'}
            </Button>
            {settings.translation.apiKey ? (
              <Button variant="text" onClick={() => setTranslation({ apiKey: '' })}>
                清除 Key
              </Button>
            ) : null}
          </div>

          <p className="settings-hint">
            按篇翻译当前英文档案，结果缓存在本机；不会自动批量翻译。Key
            只保存在本地数据库，不会上传到本项目服务器。浏览器直连需要接口允许 CORS，安卓端通过
            CapacitorHttp 直连。
          </p>
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
          <SettingRow title="SCP Archive" description="版本 0.5.0 · Capacitor + React">
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
