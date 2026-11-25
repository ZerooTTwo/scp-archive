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
