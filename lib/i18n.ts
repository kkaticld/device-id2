import { useState, useEffect } from 'react';
import { getLocales } from 'expo-localization';

type Dict = Record<string, string>;

const en: Dict = {
  'home.title': 'Device ID',
  'home.about': 'About',
  'home.deviceIdentifier': 'DEVICE IDENTIFIER',
  'home.permissionRequired': 'Permission required to read this identifier',
  'home.allowAccess': 'Allow Access',
  'home.loading': 'Loading...',
  'home.appInfo': 'App Info',
  'home.appInfoSubtitle': 'Basic configuration',
  'home.copyAll': 'Copy All',
  'home.copy': 'Copy',
  'home.bundleId': 'Bundle ID',
  'home.version': 'Version',
  'home.build': 'Build',
  'home.network': 'NETWORK',
  'home.userAgent': 'User Agent',
  'home.userAgentSubtitle': 'Browser identifier',
  'home.ipAddress': 'IP Address',
  'home.ipSubtitle': 'Network address',
  'home.tapToLoad': 'Tap to load',
  'home.getUa': 'Get UA',
  'home.getIp': 'Get IP',
  'home.copied': 'Copied',
  'home.shareTitle': 'Device ID Information',
  'home.ipFailedTitle': 'Failed',
  'home.ipFailedParse': 'Could not parse IP address',
  'home.ipFailedFetch': 'Could not get IP address',
  'home.issueReported': 'Issue reported (ID: {id})',

  'debug.title': 'Debug Info',
  'debug.show': 'Show ▼',
  'debug.hide': 'Hide ▲',
  'debug.permission': 'Permission:',
  'debug.logs': 'Logs:',
  'debug.noLogs': 'No logs yet',
  'debug.copyLogs': 'Copy Logs',
  'debug.retry': 'Retry',
  'debug.reportIssue': 'Report Issue',
  'debug.errorPrefix': 'Error:',
  'debug.granted': 'Granted',
  'debug.denied': 'Denied',
  'debug.undetermined': 'Not determined',
  'debug.unknown': 'Unknown',
  'debug.allowed': 'Allowed',
  'debug.statusDenied': 'Denied',
  'debug.notDetermined': 'Not determined',
  'debug.statusUnknown': 'Unknown ({status})',
  'debug.troubleTitle': 'Troubleshooting',
  'debug.troubleIntro': 'Permission granted but IDFA is empty. Check:',
  'debug.trouble1': '1. Use a real device (the simulator has no IDFA)',
  'debug.trouble2': '2. Settings → Privacy → Apple Advertising → Personalized Ads',
  'debug.trouble3': '3. Settings → Privacy → Tracking → this app is on',
  'debug.trouble4': '4. Restart the app or grant permission again',
  'debug.enableTitle': 'How to enable',
  'debug.enable1': '1. Open the Settings app',
  'debug.enable2': '2. Scroll down to DeviceId2',
  'debug.enable3': '3. Open the app settings',
  'debug.enable4': '4. Turn on "Allow Tracking"',
  'debug.enable5': '5. Come back and refresh',
  'debug.tipTitle': 'Tip',
  'debug.tipText': 'Tap "Allow Access" above to request permission',

  'about.title': 'About',
  'about.intro1':
    'DeviceId2 is a simple viewer for common device identifiers (IDFA/GAID, IDFV, User Agent, IP). It needs no account and shows no ads.',
  'about.intro2':
    'Identifiers stay on your device. The only optional network use is anonymous crash/diagnostic reporting.',
  'about.creditsLink': 'Credits',
  'about.back': 'Back',

  'credits.title': 'Credits',
  'credits.back': 'Back',
  'credits.hero':
    'Background patterns: Hero Patterns by Steve Schoger (CC BY 4.0) · heropatterns.com',
  'credits.monster': 'Additional patterns: pattern.monster (MIT)',
};

const zh: Dict = {
  'home.title': '设备标识',
  'home.about': '关于',
  'home.deviceIdentifier': '设备标识符',
  'home.permissionRequired': '需要授权才能读取此标识符',
  'home.allowAccess': '允许访问',
  'home.loading': '加载中…',
  'home.appInfo': '应用信息',
  'home.appInfoSubtitle': '基本配置',
  'home.copyAll': '全部复制',
  'home.copy': '复制',
  'home.bundleId': 'Bundle ID',
  'home.version': '版本',
  'home.build': '构建号',
  'home.network': '网络',
  'home.userAgent': 'User Agent',
  'home.userAgentSubtitle': '浏览器标识',
  'home.ipAddress': 'IP 地址',
  'home.ipSubtitle': '网络地址',
  'home.tapToLoad': '点击加载',
  'home.getUa': '获取 UA',
  'home.getIp': '获取 IP',
  'home.copied': '已复制',
  'home.shareTitle': '设备标识信息',
  'home.ipFailedTitle': '失败',
  'home.ipFailedParse': '无法解析 IP 地址',
  'home.ipFailedFetch': '无法获取 IP 地址',
  'home.issueReported': '已反馈问题（ID: {id}）',

  'debug.title': '调试信息',
  'debug.show': '显示 ▼',
  'debug.hide': '隐藏 ▲',
  'debug.permission': '权限：',
  'debug.logs': '日志：',
  'debug.noLogs': '暂无日志',
  'debug.copyLogs': '复制日志',
  'debug.retry': '重试',
  'debug.reportIssue': '反馈问题',
  'debug.errorPrefix': '错误：',
  'debug.granted': '已授权',
  'debug.denied': '已拒绝',
  'debug.undetermined': '未决定',
  'debug.unknown': '未知',
  'debug.allowed': '已允许',
  'debug.statusDenied': '已拒绝',
  'debug.notDetermined': '未决定',
  'debug.statusUnknown': '未知（{status}）',
  'debug.troubleTitle': '故障排除',
  'debug.troubleIntro': '已授权但 IDFA 为空，请检查：',
  'debug.trouble1': '1. 请使用真机（模拟器没有 IDFA）',
  'debug.trouble2': '2. 设置 → 隐私 → Apple 广告 → 个性化广告',
  'debug.trouble3': '3. 设置 → 隐私 → 跟踪 → 已开启本应用',
  'debug.trouble4': '4. 重启应用或重新授权',
  'debug.enableTitle': '如何开启',
  'debug.enable1': '1. 打开“设置”应用',
  'debug.enable2': '2. 向下滚动找到 DeviceId2',
  'debug.enable3': '3. 打开应用设置',
  'debug.enable4': '4. 打开“允许跟踪”',
  'debug.enable5': '5. 返回本应用并刷新',
  'debug.tipTitle': '提示',
  'debug.tipText': '点击上方的“允许访问”以请求权限',

  'about.title': '关于',
  'about.intro1':
    'DeviceId2 是一个简单的设备标识查看工具（IDFA/GAID、IDFV、User Agent、IP）。无需账号，不含广告。',
  'about.intro2':
    '标识符保存在本机。唯一可选的联网用途是匿名崩溃/诊断上报。',
  // 「署名」= attribution (CC BY Credits). Prefer over「版权声明」(copyright notice).
  'about.creditsLink': '署名',
  'about.back': '返回',

  'credits.title': '署名',
  'credits.back': '返回',
  'credits.hero': en['credits.hero'],
  'credits.monster': en['credits.monster'],
};

export type LocaleCode = 'en' | 'zh';

function detectLocale(): LocaleCode {
  try {
    const tag = (getLocales()[0]?.languageTag || getLocales()[0]?.languageCode || 'en').toLowerCase();
    if (tag.startsWith('zh')) return 'zh';
    if (tag.startsWith('en')) return 'en';
  } catch {
    // fall through
  }
  return 'en';
}

let locale: LocaleCode = detectLocale();
const listeners = new Set<() => void>();

function readQueryLang(): LocaleCode | null {
  try {
    if (typeof location !== 'undefined') {
      const lang = new URLSearchParams(location.search).get('lang');
      if (lang === 'zh' || lang === 'en') return lang;
    }
  } catch {
    /* native */
  }
  return null;
}

/** Optional override for screenshots / tests (e.g. ?lang=zh). */
export function setLocaleOverride(next: LocaleCode | null) {
  const resolved = next ?? readQueryLang() ?? detectLocale();
  if (resolved !== locale) {
    locale = resolved;
    listeners.forEach((l) => l());
  } else {
    locale = resolved;
  }
}

export function getLocale(): LocaleCode {
  return locale;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const table = locale === 'zh' ? zh : en;
  let s = table[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return s;
}

/** Hook so screens re-render when locale override changes. */
export function useI18n() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const fromQuery = readQueryLang();
    if (fromQuery) setLocaleOverride(fromQuery);
    const fn = () => setTick((n) => n + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return { t, locale: getLocale(), setLocaleOverride, tick };
}

// Apply ?lang= as early as possible on web
setLocaleOverride(readQueryLang());

export default t;
