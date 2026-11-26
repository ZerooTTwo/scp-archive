import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_SETTINGS } from '../lib/constants';
import { isClearance } from '../lib/clearance';
import { applyDesktopIcon } from '../lib/appIcon';
import { readSettings, writeSettings } from '../lib/db';
import { useResolvedTheme, useThemeEffect } from '../lib/hooks';
import type { Branch, Clearance, Settings, ThemeMode } from '../lib/types';

interface SettingsContextValue {
  settings: Settings;
  resolvedTheme: 'light' | 'dark';
  loaded: boolean;
  update: (patch: Partial<Settings>) => void;
  setTheme: (theme: ThemeMode) => void;
  setClearance: (clearance: Clearance) => void;
  setBranch: (branch: Branch) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function mergeSettings(stored: Partial<Settings> | undefined): Settings {
  if (!stored) return { ...DEFAULT_SETTINGS };
  return {
    theme:
      stored.theme === 'light' || stored.theme === 'dark' || stored.theme === 'system'
        ? stored.theme
        : DEFAULT_SETTINGS.theme,
    clearance: isClearance(stored.clearance) ? stored.clearance : DEFAULT_SETTINGS.clearance,
    fontScale:
      typeof stored.fontScale === 'number' && stored.fontScale >= 0.8 && stored.fontScale <= 1.4
        ? stored.fontScale
        : DEFAULT_SETTINGS.fontScale,
    lineHeight:
      typeof stored.lineHeight === 'number' && stored.lineHeight >= 1.5 && stored.lineHeight <= 2.3
        ? stored.lineHeight
        : DEFAULT_SETTINGS.lineHeight,
    serif: typeof stored.serif === 'boolean' ? stored.serif : DEFAULT_SETTINGS.serif,
    branch: stored.branch === 'en' ? 'en' : 'cn',
    appIcon: stored.appIcon === 'cn' ? 'cn' : 'official',
    translation: {
      endpoint:
        typeof stored.translation?.endpoint === 'string' &&
        stored.translation.endpoint.trim()
          ? stored.translation.endpoint.trim().slice(0, 500)
          : DEFAULT_SETTINGS.translation.endpoint,
      model:
        typeof stored.translation?.model === 'string' && stored.translation.model.trim()
          ? stored.translation.model.trim().slice(0, 160)
          : DEFAULT_SETTINGS.translation.model,
      apiKey:
        typeof stored.translation?.apiKey === 'string'
          ? stored.translation.apiKey.slice(0, 1000)
          : '',
    },
  };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const resolvedTheme = useResolvedTheme(settings.theme);
  useThemeEffect(resolvedTheme);

  useEffect(() => {
    document.documentElement.dataset.clearance = settings.clearance;
    try {
      localStorage.setItem('scp-clearance', settings.clearance);
    } catch {
      // localStorage may be unavailable; the DB copy still applies.
    }
  }, [settings.clearance]);

  useEffect(() => {
    try {
      localStorage.setItem('scp-app-icon', settings.appIcon);
    } catch {
      // localStorage may be unavailable; the DB copy still applies.
    }
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon) favicon.href = `/icons/${settings.appIcon}/icon-192.png`;
    const apple = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (apple) apple.href = `/icons/${settings.appIcon}/apple-touch-icon.png`;
  }, [settings.appIcon]);

  // Keep the Android launcher alias in sync with the saved preference. The
  // promise rejects only on unsupported shells, where the favicon is enough.
  useEffect(() => {
    if (!loaded) return;
    void applyDesktopIcon(settings.appIcon).catch(() => undefined);
  }, [loaded, settings.appIcon]);

  useEffect(() => {
    let cancelled = false;
    void readSettings().then((stored) => {
      if (cancelled) return;
      setSettings(mergeSettings(stored));
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = mergeSettings({ ...current, ...patch });
      void writeSettings(next);
      if (next.theme !== current.theme) {
        try {
          localStorage.setItem('scp-theme', next.theme);
        } catch {
          // localStorage may be unavailable; the DB copy still applies.
        }
      }
      if (next.clearance !== current.clearance) {
        try {
          localStorage.setItem('scp-clearance', next.clearance);
        } catch {
          // localStorage may be unavailable; the DB copy still applies.
        }
      }
      return next;
    });
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => update({ theme }), [update]);
  const setClearance = useCallback(
    (clearance: Clearance) => update({ clearance }),
    [update],
  );
  const setBranch = useCallback((branch: Branch) => update({ branch }), [update]);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, resolvedTheme, loaded, update, setTheme, setClearance, setBranch }),
    [settings, resolvedTheme, loaded, update, setTheme, setClearance, setBranch],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside SettingsProvider');
  return context;
}
