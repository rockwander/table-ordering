import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ramanis.cafe',
  appName: "Ramani's Cafe Admin",
  webDir: 'public',
  server: {
    url: 'https://table-ordering-jfbx3pfqv-vishalragh13-7282s-projects.vercel.app/mobile/dashboard',
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
