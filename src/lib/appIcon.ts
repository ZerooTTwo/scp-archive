import { Capacitor, registerPlugin } from '@capacitor/core';
import type { AppIcon } from './types';

interface AppIconPlugin {
  setIcon(options: { icon: AppIcon }): Promise<void>;
}

const AppIconNative = registerPlugin<AppIconPlugin>('AppIcon');
let pending: Promise<void> = Promise.resolve();

/**
 * Switches the Android launcher icon. The web build only changes the in-app
 * mark/favicon, so this is a no-op outside a native shell. Calls are serialized
 * so rapid radio-button changes cannot leave both aliases enabled.
 */
export function applyDesktopIcon(icon: AppIcon): Promise<void> {
  const run = pending.then(async () => {
    if (!Capacitor.isNativePlatform()) return;
    await AppIconNative.setIcon({ icon });
  });
  pending = run.catch(() => undefined);
  return run;
}
