import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hdequiz.app',
  appName: 'EduQuiz',
  webDir: 'out',
  server: {
    androidScheme: 'http',
    cleartext: true
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: false,
    },
    CapacitorHttp: {
      enabled: true,
    },
  }
};

export default config;
