import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ramanis.cafe',
  appName: "Ramani's Cafe Admin",
  webDir: 'public',
  server: {
    // Load from your live Vercel URL - this enables auto-updates!
    url: 'https://table-ordering-gamma.vercel.app',
    cleartext: false
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
