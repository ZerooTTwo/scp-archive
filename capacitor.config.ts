import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.scparchive.reader',
  appName: 'SCP Archive',
  webDir: 'dist',
  backgroundColor: '#141110',
  android: {
    allowMixedContent: false,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 700,
      launchAutoHide: false,
      backgroundColor: '#141110',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#141110',
      overlaysWebView: false,
    },
  },
};

export default config;
