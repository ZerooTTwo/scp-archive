import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export const isNative = Capacitor.isNativePlatform();

export function useResolvedTheme(mode: 'system' | 'light' | 'dark'): 'light' | 'dark' {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  return mode === 'system' ? systemTheme : mode;
}

/** Applies theme to the document, browser chrome and (on device) the status bar. */
export function useThemeEffect(theme: 'light' | 'dark'): void {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    const meta = document.getElementById('theme-color');
    const color = theme === 'dark' ? '#12100e' : '#efe9dd';
    meta?.setAttribute('content', color);

    if (!isNative) return;
    void (async () => {
      try {
        await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
        await StatusBar.setBackgroundColor({ color });
      } catch {
        // Status bar is best-effort; edge-to-edge Android may ignore the colour.
      }
    })();
  }, [theme]);
}

export async function lightHaptic(): Promise<void> {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // ignore
  }
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

/** Native hardware back button → router back, or exit at the root screen. */
export function useNativeBack(onBackAtRoot: () => void): void {
  const handler = useRef(onBackAtRoot);
  handler.current = onBackAtRoot;

  useEffect(() => {
    if (!isNative) return;
    let remove: (() => void) | undefined;
    void App.addListener('backButton', ({ canGoBack }) => {
      const hash = window.location.hash.replace(/^#/, '');
      const atRoot = !hash || hash === '/';
      if (atRoot) {
        handler.current();
        return;
      }
      if (canGoBack) window.history.back();
      else window.location.hash = '#/';
    }).then((listener) => {
      remove = () => void listener.remove();
    });
    return () => remove?.();
  }, []);
}

export function useSplash(): void {
  useEffect(() => {
    if (!isNative) return;
    const timer = window.setTimeout(() => {
      void SplashScreen.hide().catch(() => undefined);
    }, 120);
    return () => window.clearTimeout(timer);
  }, []);
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener('change', listener);
    setMatches(media.matches);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  return matches;
}

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useStableCallback<T extends (...args: never[]) => unknown>(callback: T): T {
  const ref = useRef(callback);
  ref.current = callback;
  return useCallback(((...args: never[]) => ref.current(...args)) as T, []);
}

export function useDocumentTitle(title: string | null): void {
  const base = 'SCP 档案库 · 基金会档案';
  useEffect(() => {
    document.title = title ? `${title} · SCP 档案库` : base;
    return () => {
      document.title = base;
    };
  }, [title]);
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export function useMounted(): { current: boolean } {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
}

export function useConstant<T>(factory: () => T): T {
  const ref = useRef<T | null>(null);
  if (ref.current === null) ref.current = factory();
  return ref.current;
}

export function useIsStandalone(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined') return false;
    const navigatorStandalone = (window.navigator as Navigator & { standalone?: boolean })
      .standalone;
    return window.matchMedia('(display-mode: standalone)').matches || Boolean(navigatorStandalone);
  }, []);
}
