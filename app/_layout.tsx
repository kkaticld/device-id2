import { Stack } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import '@/lib/i18n';


const UUID_RE = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;

// Initialize Sentry
Sentry.init({
  dsn: 'https://5aaca94bee2c4218db9e504071b5447d@o4510284665782272.ingest.us.sentry.io/4510284668665856',
  environment: __DEV__ ? 'development' : 'production',
  enabled: !__DEV__, // 仅在生产环境启用
  tracesSampleRate: 1.0, // 100% 性能追踪
  enableAutoSessionTracking: true,
  attachStacktrace: true,
  // Never send console output as breadcrumbs (it may contain device identifiers)
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === 'console') return null;
    return breadcrumb;
  },
  beforeSend(event) {
    // Defense in depth: redact anything shaped like an IDFA/IDFV (UUID)
    try {
      return JSON.parse(JSON.stringify(event).replace(UUID_RE, '[redacted-id]'));
    } catch {
      return event;
    }
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

// 添加App launched面包屑
Sentry.addBreadcrumb({
  category: 'lifecycle',
  message: 'App launched',
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
      <Stack.Screen name="about" />
      <Stack.Screen name="credits" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}