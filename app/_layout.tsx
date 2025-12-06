import { Stack } from 'expo-router';
import 'react-native-reanimated';
import * as Sentry from '@sentry/react-native';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

// 初始化 Sentry
Sentry.init({
  dsn: 'https://5aaca94bee2c4218db9e504071b5447d@o4510284665782272.ingest.us.sentry.io/4510284668665856',
  environment: __DEV__ ? 'development' : 'production',
  enabled: !__DEV__, // 仅在生产环境启用
  tracesSampleRate: 1.0, // 100% 性能追踪
  enableAutoSessionTracking: true,
  attachStacktrace: true,
  beforeSend(event, hint) {
    // 开发环境下打印日志
    if (__DEV__) {
      console.log('[Sentry] Event:', event);
    }
    return event;
  },
});

// 设置全局上下文
Sentry.setContext('device_info', {
  platform: Platform.OS,
  platform_version: String(Platform.Version),
  app_version: Application.nativeApplicationVersion,
  build_version: Application.nativeBuildVersion,
  bundle_id: Application.applicationId,
});

// 添加应用启动面包屑
Sentry.addBreadcrumb({
  category: 'lifecycle',
  message: '应用启动',
  level: 'info',
  data: {
    platform: Platform.OS,
    version: Application.nativeApplicationVersion,
  }
});

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}