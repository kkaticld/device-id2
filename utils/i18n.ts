import * as Localization from 'expo-localization';

export interface Translations {
  // 通用
  ok: string;
  cancel: string;
  share: string;
  copied: string;
  loading: string;
  noData: string;
  getFailed: string;
  shareFailed: string;
  retryLater: string;
  
  // 设备信息
  deviceInfo: string;
  gettingDeviceInfo: string;
  
  // IDFA相关
  clickGetIdfa: string;
  permissionDenied: string;
  enableTrackingInSettings: string;
  goToSettings: string;
  
  // UserAgent
  clickGetUserAgent: string;
  
  // IP地址
  clickGetIP: string;
  gettingIP: string;
  cannotGetIP: string;
  
  // 分享相关
  shareTitle: string;
  copiedToClipboard: string;
  canPasteToOtherApps: string;
  
  // 分享内容
  shareContent: {
    title: string;
    idfa: string;
    idfv: string;
    userAgent: string;
    ipAddress: string;
    platform: string;
    timestamp: string;
    notObtained: string;
  };
}

const zh: Translations = {
  // 通用
  ok: '好的',
  cancel: '取消',
  share: '分享',
  copied: '已复制',
  loading: '加载中...',
  noData: '暂无数据',
  getFailed: '获取失败',
  shareFailed: '分享失败',
  retryLater: '请稍后重试',
  
  // 设备信息
  deviceInfo: '设备信息',
  gettingDeviceInfo: '正在获取设备信息...',
  
  // IDFA相关
  clickGetIdfa: 'Click Get IDFA',
  permissionDenied: '权限被拒绝',
  enableTrackingInSettings: '请到设置中开启跟踪权限',
  goToSettings: 'Go to Settings',
  
  // UserAgent
  clickGetUserAgent: 'Click Get UserAgent',
  
  // IP地址
  clickGetIP: 'Click Get IP',
  gettingIP: '获取中...',
  cannotGetIP: '无法获取IP地址',
  
  // 分享相关
  shareTitle: '分享设备信息',
  copiedToClipboard: '已复制到剪贴板',
  canPasteToOtherApps: '设备信息已复制，您可以粘贴到其他应用',
  
  // 分享内容
  shareContent: {
    title: '设备信息：',
    idfa: 'IDFA',
    idfv: 'IDFV',
    userAgent: 'UserAgent',
    ipAddress: 'IP地址',
    platform: '平台',
    timestamp: '时间',
    notObtained: '未获取',
  },
};

const en: Translations = {
  // 通用
  ok: 'OK',
  cancel: 'Cancel',
  share: 'Share',
  copied: 'Copied',
  loading: 'Loading...',
  noData: 'No Data',
  getFailed: 'Failed to Get',
  shareFailed: 'Share Failed',
  retryLater: 'Please try again later',
  
  // 设备信息
  deviceInfo: 'Device Info',
  gettingDeviceInfo: 'Getting device information...',
  
  // IDFA相关
  clickGetIdfa: 'Click Get IDFA',
  permissionDenied: 'Permission Denied',
  enableTrackingInSettings: 'Please enable tracking permission in Settings',
  goToSettings: 'Go to Settings',
  
  // UserAgent
  clickGetUserAgent: 'Click Get UserAgent',
  
  // IP地址
  clickGetIP: 'Click Get IP',
  gettingIP: 'Getting...',
  cannotGetIP: 'Cannot get IP address',
  
  // 分享相关
  shareTitle: 'Share Device Info',
  copiedToClipboard: 'Copied to Clipboard',
  canPasteToOtherApps: 'Device info copied, you can paste it to other apps',
  
  // 分享内容
  shareContent: {
    title: 'Device Information:',
    idfa: 'IDFA',
    idfv: 'IDFV',
    userAgent: 'UserAgent',
    ipAddress: 'IP Address',
    platform: 'Platform',
    timestamp: 'Timestamp',
    notObtained: 'Not Obtained',
  },
};

export const useI18n = () => {
  const locale = Localization.getLocales()[0]?.languageCode || 'en';
  const isZh = locale.startsWith('zh');
  
  return {
    t: isZh ? zh : en,
    locale,
    isZh,
  };
};

export default { zh, en };