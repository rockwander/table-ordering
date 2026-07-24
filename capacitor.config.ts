import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ramanis.cafe',
  appName: "Ramani's Cafe Admin",
  webDir: 'public',
  server: {
    url: 'https://table-ordering-gamma.vercel.app',
    cleartext: false,
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
