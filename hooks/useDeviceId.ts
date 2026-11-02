import * as Application from 'expo-application';
import * as TrackingTransparency from 'expo-tracking-transparency';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';

// 增强的调试日志函数
const debugLog = (tag: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logPrefix = `[${timestamp}] [${tag}]`;
  
  if (data !== undefined) {
    console.log(`${logPrefix} ${message}`, data);
    // 如果是对象或数组，也打印JSON格式便于查看
    if (typeof data === 'object' && data !== null) {
      try {
        console.log(`${logPrefix} ${message} [JSON]:`, JSON.stringify(data, null, 2));
      } catch (e) {
        // 忽略循环引用错误
      }
    }
  } else {
    console.log(`${logPrefix} ${message}`);
  }
};

// 错误日志函数 - 使用 console.warn 避免 Expo Go 显示红色弹窗
const errorLog = (tag: string, message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] [ERROR-${tag}] ${message}`);
  if (error) {
    console.warn(`[${timestamp}] [ERROR-${tag}] Error Details:`, error);
    if (error.stack) {
      console.warn(`[${timestamp}] [ERROR-${tag}] Stack Trace:`, error.stack);
    }
  }
};

interface DeviceInfo {
  advertisingId: string | null;
  idfv: string | null;
  androidId: string | null;
  applicationId: string | null;
  nativeVersion: string | null;
  nativeBuildVersion: string | null;
  isLoading: boolean;
  permissionStatus: TrackingTransparency.PermissionStatus | null;
  requestPermission: () => Promise<void>;
  debugInfo: string[];  // 新增：调试信息
  lastError: string | null;  // 新增：最后错误
}

export function useDeviceId(): DeviceInfo {
  const [advertisingId, setAdvertisingId] = useState<string | null>(null);
  const [idfv, setIdfv] = useState<string | null>(null);
  const [androidId, setAndroidId] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [nativeVersion, setNativeVersion] = useState<string | null>(null);
  const [nativeBuildVersion, setNativeBuildVersion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<TrackingTransparency.PermissionStatus | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const addDebugInfo = useCallback((info: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${info}`]);
  }, []);

  const getIds = useCallback(async () => {
    console.log('\n========== 🔍 Loading device info ==========\n');
    debugLog('INIT', 'Loading device info');
    addDebugInfo('🔄 Loading device info');
    
    // Sentry: 添加面包屑 - Loading device info
    Sentry.addBreadcrumb({
      category: 'idfa',
      message: 'Loading device info',
      level: 'info',
    });
    
    setIsLoading(true);
    setLastError(null);
    
    try {
      // Step 1: Get Application Info (cross-platform)
      console.log('\n--- Step 1: Get app info ---');
      debugLog('APP_INFO', 'Application.applicationId', Application.applicationId);
      debugLog('APP_INFO', 'Application.nativeApplicationVersion', Application.nativeApplicationVersion);
      debugLog('APP_INFO', 'Application.nativeBuildVersion', Application.nativeBuildVersion);
      
      setApplicationId(Application.applicationId);
      setNativeVersion(Application.nativeApplicationVersion);
      setNativeBuildVersion(Application.nativeBuildVersion);
      addDebugInfo(`✅ App ID: ${Application.applicationId}`);
      addDebugInfo(`✅ Version: ${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`);
      
      // Sentry: 记录App Info
      Sentry.addBreadcrumb({
        category: 'app_info',
        message: 'Got app info',
        data: {
          bundle_id: Application.applicationId,
          version: Application.nativeApplicationVersion,
          build: Application.nativeBuildVersion,
        },
        level: 'info',
      });
      
      // Step 2: Platform-specific IDs
      console.log('\n--- Step 2: Get platform ID ---');
      debugLog('PLATFORM', 'Platform.OS', Platform.OS);
      debugLog('PLATFORM', 'Platform.Version', Platform.Version);
      addDebugInfo(`📱 Platform: ${Platform.OS} ${Platform.Version}`);
      
      if (Platform.OS === 'ios') {
        // iOS: Get IDFV
        console.log('\n--- Step 3 (iOS): Get IDFV ---');
        debugLog('IOS', 'Calling Application.getIosIdForVendorAsync()...');
        addDebugInfo('🔄 Getting IDFV...');
        
        Sentry.addBreadcrumb({
          category: 'idfa',
          message: 'Start getting IDFV',
          level: 'info',
        });
        
        try {
          const vendorId = await Application.getIosIdForVendorAsync();
          debugLog('IOS', 'Got IDFV', { hasValue: !!vendorId });
          setIdfv(vendorId);
          if (vendorId) {
            addDebugInfo('✅ IDFV: obtained');
            Sentry.addBreadcrumb({
              category: 'idfa',
              message: 'Got IDFV',
              data: { has_value: true },
              level: 'info',
            });
          } else {
            addDebugInfo('⚠️ IDFV empty');
            errorLog('IOS', 'IDFV returned null');
            Sentry.captureMessage('IDFV empty', {
              level: 'warning',
              tags: { feature: 'idfa', step: 'get_idfv' },
            });
          }
        } catch (idfvError: any) {
          const errorMsg = `Failed to get IDFV: ${idfvError?.message || String(idfvError)}`;
          errorLog('IOS', errorMsg, idfvError);
          addDebugInfo(`❌ ${errorMsg}`);
          setLastError(errorMsg);
          
          // Sentry: 捕获IDFV错误
          Sentry.captureException(idfvError, {
            tags: { feature: 'idfa', step: 'get_idfv' },
            contexts: {
              device: {
                platform: Platform.OS,
                version: Platform.Version,
              }
            }
          });
        }
      } else if (Platform.OS === 'android') {
        // Android: Get Android ID
        console.log('\n--- Step 3 (Android): Get Android ID ---');
        debugLog('ANDROID', 'Calling Application.getAndroidId()...');
        addDebugInfo('🔄 Getting Android ID...');
        
        try {
          const deviceId = Application.getAndroidId();
          debugLog('ANDROID', 'Got Android ID', { hasValue: !!deviceId });
          setAndroidId(deviceId);
          if (deviceId) {
            addDebugInfo('✅ Android ID: obtained');
          } else {
            addDebugInfo('⚠️ Android ID empty');
            errorLog('ANDROID', 'Android ID returned null');
          }
        } catch (androidError: any) {
          const errorMsg = `Failed to get Android ID: ${androidError?.message || String(androidError)}`;
          errorLog('ANDROID', errorMsg, androidError);
          addDebugInfo(`❌ ${errorMsg}`);
          setLastError(errorMsg);
        }
      }

      // Step 4: Get Advertising ID (IDFA on iOS, GAID on Android)
      console.log('\n--- Step 4: Check tracking permission ---');
      debugLog('TRACKING', 'Calling TrackingTransparency.getTrackingPermissionsAsync()...');
      addDebugInfo('🔄 Checking tracking permission...');
      
      Sentry.addBreadcrumb({
        category: 'idfa',
        message: 'Start checking tracking permission',
        level: 'info',
      });
      
      try {
        const permissionResult = await TrackingTransparency.getTrackingPermissionsAsync();
        const { status } = permissionResult;
        debugLog('TRACKING', 'Permission status', {
          status,
          statusName: getStatusName(status)
        });
        setPermissionStatus(status);
        addDebugInfo(`📋 Permission: ${getStatusName(status)} (value=${status})`);
        
        // Sentry: 记录Permission status
        Sentry.setContext('idfa_permission', {
          status,
          status_name: getStatusName(status),
          granted: status === TrackingTransparency.PermissionStatus.GRANTED,
        });
        
        Sentry.addBreadcrumb({
          category: 'idfa',
          message: 'Permission check done',
          data: {
            status,
            status_name: getStatusName(status),
          },
          level: 'info',
        });
        
        if (status === TrackingTransparency.PermissionStatus.GRANTED) {
          console.log('\n--- Step 5: Get advertising ID ---');
          debugLog('TRACKING', '✅ Permission granted, calling getAdvertisingId()...');
          addDebugInfo('✅ Permission granted, reading IDFA...');
          
          Sentry.addBreadcrumb({
            category: 'idfa',
            message: 'Permission granted, getting IDFA',
            level: 'info',
          });
          
          try {
            const adId = await TrackingTransparency.getAdvertisingId();
            debugLog('TRACKING', 'getAdvertisingId() result', { hasValue: !!adId });
            
            if (adId) {
              setAdvertisingId(adId);
              addDebugInfo('✅ IDFA: obtained');
              console.log('\n✨ IDFA obtained\n');
              
              // Sentry: 成功获取IDFA
              Sentry.addBreadcrumb({
                category: 'idfa',
                message: 'Got IDFA',
                data: { has_value: true },
                level: 'info',
              });
              
              Sentry.setContext('idfa_state', {
                has_idfa: true,
                permission_granted: true,
              });
            } else {
              setAdvertisingId(null);
              addDebugInfo('⚠️ IDFA empty (see below)');
              addDebugInfo('💡 Check:');
              addDebugInfo('  1. Settings > Privacy > Tracking is on');
              addDebugInfo('  2. Settings > Privacy > Apple Advertising is off');
              addDebugInfo('  3. Testing on a real device (simulator unsupported)');
              errorLog('TRACKING', 'IDFA empty: 1) ad tracking off 2) device restriction 3) simulator');
              
              // Sentry: IDFA为空警告
              Sentry.captureMessage('IDFA empty (permission granted)', {
                level: 'warning',
                tags: { feature: 'idfa', step: 'get_advertising_id' },
                contexts: {
                  idfa_debug: {
                    permission_status: status,
                    platform: Platform.OS,
                    platform_version: Platform.Version,
                    possible_reasons: [
                      'personalized ads off',
                      'device restriction',
                      'simulator'
                    ]
                  }
                }
              });
            }
          } catch (adIdError: any) {
            const errorMsg = `Advertising ID API failed: ${adIdError?.message || String(adIdError)}`;
            errorLog('TRACKING', errorMsg, adIdError);
            addDebugInfo(`❌ ${errorMsg}`);
            addDebugInfo('💡 Possible cause: API error or permission config');
            setLastError(errorMsg);
            
            // Sentry: 捕获IDFA获取错误
            Sentry.captureException(adIdError, {
              tags: { feature: 'idfa', step: 'get_advertising_id' },
              contexts: {
                idfa_debug: {
                  permission_status: status,
                  permission_granted: true,
                  platform: Platform.OS,
                }
              }
            });
          }
        } else {
          console.log('\n⚠️ Permission not granted, cannot read IDFA');
          debugLog('TRACKING', 'Permission not granted', { status, statusName: getStatusName(status) });
          addDebugInfo(`❌ Not granted: ${getStatusName(status)}`);
          
          // Sentry: 记录Permission not granted情况
          Sentry.captureMessage('IDFA permission not granted', {
            level: status === TrackingTransparency.PermissionStatus.DENIED ? 'warning' : 'info',
            tags: { feature: 'idfa', step: 'check_permission' },
            contexts: {
              permission: {
                status,
                status_name: getStatusName(status),
                is_denied: status === TrackingTransparency.PermissionStatus.DENIED,
                is_undetermined: status === TrackingTransparency.PermissionStatus.UNDETERMINED,
              }
            }
          });
          
          if (status === TrackingTransparency.PermissionStatus.DENIED) {
            addDebugInfo('📌 Permission denied');
            addDebugInfo('💡 Fix: Settings > Privacy & Security > Tracking > allow this app');
          } else if (status === TrackingTransparency.PermissionStatus.UNDETERMINED) {
            addDebugInfo('📌 Not chosen yet');
            addDebugInfo('💡 Tip: tap "Allow Access" to request permission');
          } else {
            addDebugInfo(`📌 Unknown status: ${status}`);
          }
        }
      } catch (trackingError: any) {
        const errorMsg = `Tracking permission API failed: ${trackingError?.message || String(trackingError)}`;
        errorLog('TRACKING', errorMsg, trackingError);
        addDebugInfo(`❌ ${errorMsg}`);
        addDebugInfo('💡 Possible cause: Info.plist config or SDK version');
        setLastError(errorMsg);
        
        // Sentry: 捕获权限检查错误
        Sentry.captureException(trackingError, {
          tags: { feature: 'idfa', step: 'check_permission' },
          contexts: {
            error_debug: {
              platform: Platform.OS,
              possible_causes: ['Info.plist missing config', 'SDK version issue', 'API call error']
            }
          }
        });
      }
      
    } catch (error: any) {
      const errorMsg = `Unexpected error loading device info: ${error?.message || String(error)}`;
      errorLog('FATAL', errorMsg, error);
      addDebugInfo(`❌ ${errorMsg}`);
      setLastError(errorMsg);
      
      // Sentry: 捕获致命错误
      Sentry.captureException(error, {
        tags: { feature: 'idfa', step: 'get_device_info', severity: 'fatal' },
        contexts: {
          app_state: {
            platform: Platform.OS,
            in_get_ids: true,
          }
        }
      });
    }
    
    console.log('\n========== ✅ Device info loaded ==========\n');
    debugLog('INIT', 'Device info loaded');
    addDebugInfo('✅ Device info loaded');
    setIsLoading(false);
  }, [addDebugInfo]);

  useEffect(() => {
    getIds();
  }, [getIds]);

  const requestPermission = useCallback(async () => {
    console.log('\n========== 🔐 Request tracking permission ==========\n');
    debugLog('REQUEST_PERMISSION', 'Requesting tracking permission...');
    addDebugInfo('🔄 Requesting tracking permission...');
    
    // Sentry: User tapped allow access
    Sentry.addBreadcrumb({
      category: 'user_action',
      message: 'User tapped allow access',
      level: 'info',
    });
    
    setIsLoading(true);
    setLastError(null);
    
    try {
      debugLog('REQUEST_PERMISSION', 'Calling TrackingTransparency.requestTrackingPermissionsAsync()...');
      const permissionResult = await TrackingTransparency.requestTrackingPermissionsAsync();
      const { status } = permissionResult;
      debugLog('REQUEST_PERMISSION', 'Permission request done', {
        status,
        statusName: getStatusName(status)
      });
      setPermissionStatus(status);
      addDebugInfo(`📋 Request result: ${getStatusName(status)} (value=${status})`);
      
      // Sentry: 记录权限请求结果
      Sentry.addBreadcrumb({
        category: 'idfa',
        message: 'Permission request done',
        data: {
          status,
          status_name: getStatusName(status),
          granted: status === TrackingTransparency.PermissionStatus.GRANTED,
        },
        level: 'info',
      });
      
      if (status === TrackingTransparency.PermissionStatus.GRANTED) {
        console.log('\n✅ Permission granted, reading IDFA...');
        debugLog('REQUEST_PERMISSION', 'Permission granted, calling getAdvertisingId()...');
        addDebugInfo('✅ Permission granted, reading IDFA...');
        
        try {
          const adId = await TrackingTransparency.getAdvertisingId();
          debugLog('REQUEST_PERMISSION', 'getAdvertisingId() result', { hasValue: !!adId });
          
          if (adId) {
            setAdvertisingId(adId);
            addDebugInfo('✅ IDFA: obtained');
            console.log('\n✨ IDFA obtained\n');
            
            // Sentry: 成功获取IDFA
            Sentry.addBreadcrumb({
              category: 'idfa',
              message: 'Got IDFA after request',
              data: { has_value: true },
              level: 'info',
            });
          } else {
            setAdvertisingId(null);
            addDebugInfo('⚠️ IDFA empty');
            addDebugInfo('💡 Check: Settings > Privacy > Apple Advertising');
            errorLog('REQUEST_PERMISSION', 'IDFA empty, personalized ads may be off');
            
            // Sentry: 权限授予但IDFA为空
            Sentry.captureMessage('IDFA empty after permission granted', {
              level: 'warning',
              tags: { feature: 'idfa', step: 'request_permission' },
            });
          }
        } catch (adIdError: any) {
          const errorMsg = `Advertising ID API failed: ${adIdError?.message || String(adIdError)}`;
          errorLog('REQUEST_PERMISSION', errorMsg, adIdError);
          addDebugInfo(`❌ ${errorMsg}`);
          setLastError(errorMsg);
          
          // Sentry: IDFAFailed
          Sentry.captureException(adIdError, {
            tags: { feature: 'idfa', step: 'request_permission_get_id' },
          });
        }
      } else {
        console.log('\n❌ Permission not granted');
        addDebugInfo(`❌ Denied or restricted: ${getStatusName(status)}`);
        
        // Sentry: 用户拒绝权限
        Sentry.captureMessage('User denied IDFA permission', {
          level: 'info',
          tags: { feature: 'idfa', step: 'request_permission', user_action: 'denied' },
          contexts: {
            permission: {
              status,
              status_name: getStatusName(status),
            }
          }
        });
        
        if (status === TrackingTransparency.PermissionStatus.DENIED) {
          addDebugInfo('📌 User denied the request');
          addDebugInfo('💡 Fix: Settings > Privacy & Security > Tracking > allow this app');
        } else {
          addDebugInfo(`📌 Permission: ${getStatusName(status)}`);
        }
      }
    } catch (error: any) {
      const errorMsg = `Error requesting permission: ${error?.message || String(error)}`;
      errorLog('REQUEST_PERMISSION', errorMsg, error);
      addDebugInfo(`❌ ${errorMsg}`);
      addDebugInfo('💡 Possible cause: Info.plist config or system restriction');
      setLastError(errorMsg);
      
      // Sentry: 权限请求错误
      Sentry.captureException(error, {
        tags: { feature: 'idfa', step: 'request_permission', severity: 'error' },
        contexts: {
          error_debug: {
            possible_causes: ['Info.plist config issue', 'system restriction', 'API error']
          }
        }
      });
    }
    
    console.log('\n========== ✅ Permission request done ==========\n');
    setIsLoading(false);
  }, [addDebugInfo]);

  return { 
    advertisingId, 
    idfv, 
    androidId,
    applicationId,
    nativeVersion,
    nativeBuildVersion,
    isLoading, 
    permissionStatus, 
    requestPermission,
    debugInfo,
    lastError,
  };
}

// 辅助函数：获取Permission status名称
function getStatusName(status: TrackingTransparency.PermissionStatus): string {
  switch (status) {
    case TrackingTransparency.PermissionStatus.GRANTED:
      return 'Allowed';
    case TrackingTransparency.PermissionStatus.DENIED:
      return 'Denied';
    case TrackingTransparency.PermissionStatus.UNDETERMINED:
      return 'Not determined';
    default:
      return `Unknown (${status})`;
  }
}
