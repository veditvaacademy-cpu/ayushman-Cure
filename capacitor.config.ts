import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.curemanage.hms',
  appName: 'CureManage HMS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
