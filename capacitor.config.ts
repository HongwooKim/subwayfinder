import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.georealestate.app',
  appName: '지하철역 거리 계산기',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'GeoRealEstate'
  },
  android: {
    allowMixedContent: true
  },
  server: {
    allowNavigation: ['dapi.kakao.com', '*.kakao.com']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e',
      showSpinner: false
    }
  }
};

export default config;
