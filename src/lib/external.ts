import { Browser } from '@capacitor/browser';
import { isNative } from './hooks';

/**
 * Open a wiki/external link outside the app. In the Android WebView a plain
 * anchor navigation would replace the reader with the wiki page (and the
 * wiki's fixed nav is unusable inside the app), so hand it to the system
 * browser instead.
 */
export async function openExternal(url: string): Promise<void> {
  if (!/^https?:\/\//i.test(url)) return;
  if (isNative) {
    try {
      await Browser.open({ url });
      return;
    } catch {
      // Fall through to the web path; the caller has no better native fallback.
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
