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

// 错误日志函数
const errorLog = (tag: string, message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [ERROR-${tag}] ${message}`);
  if (error) {
    console.error(`[${timestamp}] [ERROR-${tag}] Error Details:`, error);
    if (error.stack) {
      console.error(`[${timestamp}] [ERROR-${tag}] Stack Trace:`, error.stack);
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
    console.log('\n========== 🔍 开始获取设备信息 ==========\n');
    debugLog('INIT', '开始获取设备信息');
    addDebugInfo('🔄 开始获取设备信息');
    
    // Sentry: 添加面包屑 - 开始获取设备信息
    Sentry.addBreadcrumb({
      category: 'idfa',
      message: '开始获取设备信息',
      level: 'info',
    });
    
    setIsLoading(true);
    setLastError(null);
    
    try {
      // Step 1: Get Application Info (cross-platform)
      console.log('\n--- Step 1: 获取应用信息 ---');
      debugLog('APP_INFO', 'Application.applicationId', Application.applicationId);
      debugLog('APP_INFO', 'Application.nativeApplicationVersion', Application.nativeApplicationVersion);
      debugLog('APP_INFO', 'Application.nativeBuildVersion', Application.nativeBuildVersion);
      
      setApplicationId(Application.applicationId);
      setNativeVersion(Application.nativeApplicationVersion);
      setNativeBuildVersion(Application.nativeBuildVersion);
      addDebugInfo(`✅ App ID: ${Application.applicationId}`);
      addDebugInfo(`✅ 版本: ${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`);
      
      // Sentry: 记录应用信息
      Sentry.addBreadcrumb({
        category: 'app_info',
        message: '获取应用信息成功',
        data: {
          bundle_id: Application.applicationId,
          version: Application.nativeApplicationVersion,
          build: Application.nativeBuildVersion,
        },
        level: 'info',
      });
      
      // Step 2: Platform-specific IDs
      console.log('\n--- Step 2: 获取平台特定ID ---');
      debugLog('PLATFORM', 'Platform.OS', Platform.OS);
      debugLog('PLATFORM', 'Platform.Version', Platform.Version);
      addDebugInfo(`📱 平台: ${Platform.OS} ${Platform.Version}`);
      
      if (Platform.OS === 'ios') {
        // iOS: Get IDFV
        console.log('\n--- Step 3 (iOS): 获取IDFV ---');
        debugLog('IOS', '正在调用 Application.getIosIdForVendorAsync()...');
        addDebugInfo('🔄 正在获取IDFV...');
        
        Sentry.addBreadcrumb({
          category: 'idfa',
          message: '开始获取IDFV',
          level: 'info',
        });
        
        try {
          const vendorId = await Application.getIosIdForVendorAsync();
          debugLog('IOS', 'IDFV获取成功', vendorId);
          setIdfv(vendorId);
          if (vendorId) {
            addDebugInfo(`✅ IDFV: ${vendorId}`);
            Sentry.addBreadcrumb({
              category: 'idfa',
              message: 'IDFV获取成功',
              data: { has_value: true },
              level: 'info',
            });
          } else {
            addDebugInfo('⚠️ IDFV为空值');
            errorLog('IOS', 'IDFV返回null或undefined');
            Sentry.captureMessage('IDFV为空值', {
              level: 'warning',
              tags: { feature: 'idfa', step: 'get_idfv' },
            });
          }
        } catch (idfvError: any) {
          const errorMsg = `IDFV获取失败: ${idfvError?.message || String(idfvError)}`;
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
        console.log('\n--- Step 3 (Android): 获取Android ID ---');
        debugLog('ANDROID', '正在调用 Application.getAndroidId()...');
        addDebugInfo('🔄 正在获取Android ID...');
        
        try {
          const deviceId = Application.getAndroidId();
          debugLog('ANDROID', 'Android ID获取成功', deviceId);
          setAndroidId(deviceId);
          if (deviceId) {
            addDebugInfo(`✅ Android ID: ${deviceId}`);
          } else {
            addDebugInfo('⚠️ Android ID为空值');
            errorLog('ANDROID', 'Android ID返回null或undefined');
          }
        } catch (androidError: any) {
          const errorMsg = `Android ID获取失败: ${androidError?.message || String(androidError)}`;
          errorLog('ANDROID', errorMsg, androidError);
          addDebugInfo(`❌ ${errorMsg}`);
          setLastError(errorMsg);
        }
      }

      // Step 4: Get Advertising ID (IDFA on iOS, GAID on Android)
      console.log('\n--- Step 4: 检查追踪权限 ---');
      debugLog('TRACKING', '正在调用 TrackingTransparency.getTrackingPermissionsAsync()...');
      addDebugInfo('🔄 检查追踪权限状态...');
      
      Sentry.addBreadcrumb({
        category: 'idfa',
        message: '开始检查追踪权限',
        level: 'info',
      });
      
      try {
        const permissionResult = await TrackingTransparency.getTrackingPermissionsAsync();
        const { status } = permissionResult;
        debugLog('TRACKING', '权限状态', {
          status,
          statusName: getStatusName(status)
        });
        setPermissionStatus(status);
        addDebugInfo(`📋 权限状态: ${getStatusName(status)} (值=${status})`);
        
        // Sentry: 记录权限状态
        Sentry.setContext('idfa_permission', {
          status,
          status_name: getStatusName(status),
          granted: status === TrackingTransparency.PermissionStatus.GRANTED,
        });
        
        Sentry.addBreadcrumb({
          category: 'idfa',
          message: '权限状态检查完成',
          data: {
            status,
            status_name: getStatusName(status),
          },
          level: 'info',
        });
        
        if (status === TrackingTransparency.PermissionStatus.GRANTED) {
          console.log('\n--- Step 5: 获取广告ID ---');
          debugLog('TRACKING', '✅ 权限已授予，正在调用 getAdvertisingId()...');
          addDebugInfo('✅ 权限已授予，正在获取IDFA...');
          
          Sentry.addBreadcrumb({
            category: 'idfa',
            message: '权限已授予，开始获取IDFA',
            level: 'info',
          });
          
          try {
            const adId = await TrackingTransparency.getAdvertisingId();
            debugLog('TRACKING', 'getAdvertisingId() 返回结果', { adId, type: typeof adId, isNull: adId === null });
            
            if (adId) {
              setAdvertisingId(adId);
              addDebugInfo(`✅ IDFA获取成功: ${adId}`);
              console.log(`\n✨ 成功获取IDFA: ${adId}\n`);
              
              // Sentry: 成功获取IDFA
              Sentry.addBreadcrumb({
                category: 'idfa',
                message: 'IDFA获取成功',
                data: { has_value: true },
                level: 'info',
              });
              
              Sentry.setContext('idfa_state', {
                has_idfa: true,
                permission_granted: true,
              });
            } else {
              setAdvertisingId(null);
              addDebugInfo('⚠️ IDFA为空值（可能原因见下方）');
              addDebugInfo('💡 检查项:');
              addDebugInfo('  1. 设置->隐私->跟踪 是否打开');
              addDebugInfo('  2. 设置->隐私->Apple广告 是否关闭');
              addDebugInfo('  3. 是否使用真机测试（模拟器不支持）');
              errorLog('TRACKING', 'IDFA返回空值，可能是以下原因之一：1)用户关闭了广告跟踪 2)设备限制 3)模拟器环境');
              
              // Sentry: IDFA为空警告
              Sentry.captureMessage('IDFA为空值（权限已授予）', {
                level: 'warning',
                tags: { feature: 'idfa', step: 'get_advertising_id' },
                contexts: {
                  idfa_debug: {
                    permission_status: status,
                    platform: Platform.OS,
                    platform_version: Platform.Version,
                    possible_reasons: [
                      '用户关闭了个性化广告',
                      '设备限制',
                      '模拟器环境'
                    ]
                  }
                }
              });
            }
          } catch (adIdError: any) {
            const errorMsg = `广告ID API调用失败: ${adIdError?.message || String(adIdError)}`;
            errorLog('TRACKING', errorMsg, adIdError);
            addDebugInfo(`❌ ${errorMsg}`);
            addDebugInfo('💡 可能原因: API调用异常、权限配置问题');
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
          console.log('\n⚠️ 权限未授予，无法获取IDFA');
          debugLog('TRACKING', '权限未授予', { status, statusName: getStatusName(status) });
          addDebugInfo(`❌ 权限未授予: ${getStatusName(status)}`);
          
          // Sentry: 记录权限未授予情况
          Sentry.captureMessage('IDFA权限未授予', {
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
            addDebugInfo('📌 用户已拒绝权限');
            addDebugInfo('💡 解决方法: 设置->隐私与安全性->跟踪->允许本应用');
          } else if (status === TrackingTransparency.PermissionStatus.UNDETERMINED) {
            addDebugInfo('📌 用户尚未做出选择');
            addDebugInfo('💡 建议: 点击"获取权限"按钮请求授权');
          } else {
            addDebugInfo(`📌 未知状态: ${status}`);
          }
        }
      } catch (trackingError: any) {
        const errorMsg = `追踪权限API调用失败: ${trackingError?.message || String(trackingError)}`;
        errorLog('TRACKING', errorMsg, trackingError);
        addDebugInfo(`❌ ${errorMsg}`);
        addDebugInfo('💡 可能原因: info.plist配置缺失、SDK版本问题');
        setLastError(errorMsg);
        
        // Sentry: 捕获权限检查错误
        Sentry.captureException(trackingError, {
          tags: { feature: 'idfa', step: 'check_permission' },
          contexts: {
            error_debug: {
              platform: Platform.OS,
              possible_causes: ['info.plist配置缺失', 'SDK版本问题', 'API调用异常']
            }
          }
        });
      }
      
    } catch (error: any) {
      const errorMsg = `获取设备信息时发生未知错误: ${error?.message || String(error)}`;
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
    
    console.log('\n========== ✅ 设备信息获取完成 ==========\n');
    debugLog('INIT', '设备信息获取完成');
    addDebugInfo('✅ 设备信息获取完成');
    setIsLoading(false);
  }, [addDebugInfo]);

  useEffect(() => {
    getIds();
  }, [getIds]);

  const requestPermission = useCallback(async () => {
    console.log('\n========== 🔐 请求追踪权限 ==========\n');
    debugLog('REQUEST_PERMISSION', '开始请求追踪权限...');
    addDebugInfo('🔄 正在请求追踪权限...');
    
    // Sentry: 用户点击获取权限按钮
    Sentry.addBreadcrumb({
      category: 'user_action',
      message: '用户点击获取权限按钮',
      level: 'info',
    });
    
    setIsLoading(true);
    setLastError(null);
    
    try {
      debugLog('REQUEST_PERMISSION', '调用 TrackingTransparency.requestTrackingPermissionsAsync()...');
      const permissionResult = await TrackingTransparency.requestTrackingPermissionsAsync();
      const { status } = permissionResult;
      debugLog('REQUEST_PERMISSION', '权限请求完成', {
        status,
        statusName: getStatusName(status)
      });
      setPermissionStatus(status);
      addDebugInfo(`📋 权限请求结果: ${getStatusName(status)} (值=${status})`);
      
      // Sentry: 记录权限请求结果
      Sentry.addBreadcrumb({
        category: 'idfa',
        message: '权限请求完成',
        data: {
          status,
          status_name: getStatusName(status),
          granted: status === TrackingTransparency.PermissionStatus.GRANTED,
        },
        level: 'info',
      });
      
      if (status === TrackingTransparency.PermissionStatus.GRANTED) {
        console.log('\n✅ 权限已授予，正在获取IDFA...');
        debugLog('REQUEST_PERMISSION', '权限已授予，正在调用 getAdvertisingId()...');
        addDebugInfo('✅ 权限已授予，正在获取IDFA...');
        
        try {
          const adId = await TrackingTransparency.getAdvertisingId();
          debugLog('REQUEST_PERMISSION', 'getAdvertisingId() 返回结果', { adId, type: typeof adId });
          
          if (adId) {
            setAdvertisingId(adId);
            addDebugInfo(`✅ IDFA获取成功: ${adId}`);
            console.log(`\n✨ 成功获取IDFA: ${adId}\n`);
            
            // Sentry: 成功获取IDFA
            Sentry.addBreadcrumb({
              category: 'idfa',
              message: 'IDFA请求后获取成功',
              data: { has_value: true },
              level: 'info',
            });
          } else {
            setAdvertisingId(null);
            addDebugInfo('⚠️ IDFA为空值');
            addDebugInfo('💡 请检查: 设置->隐私->Apple广告 是否关闭');
            errorLog('REQUEST_PERMISSION', 'IDFA为空，可能用户关闭了个性化广告');
            
            // Sentry: 权限授予但IDFA为空
            Sentry.captureMessage('权限授予后IDFA仍为空', {
              level: 'warning',
              tags: { feature: 'idfa', step: 'request_permission' },
            });
          }
        } catch (adIdError: any) {
          const errorMsg = `广告ID API调用失败: ${adIdError?.message || String(adIdError)}`;
          errorLog('REQUEST_PERMISSION', errorMsg, adIdError);
          addDebugInfo(`❌ ${errorMsg}`);
          setLastError(errorMsg);
          
          // Sentry: IDFA获取失败
          Sentry.captureException(adIdError, {
            tags: { feature: 'idfa', step: 'request_permission_get_id' },
          });
        }
      } else {
        console.log('\n❌ 权限未授予');
        addDebugInfo(`❌ 权限被拒绝或受限: ${getStatusName(status)}`);
        
        // Sentry: 用户拒绝权限
        Sentry.captureMessage('用户拒绝IDFA权限请求', {
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
          addDebugInfo('📌 用户拒绝了权限请求');
          addDebugInfo('💡 解决方法: 设置->隐私与安全性->跟踪->允许本应用');
        } else {
          addDebugInfo(`📌 权限状态: ${getStatusName(status)}`);
        }
      }
    } catch (error: any) {
      const errorMsg = `请求权限时发生错误: ${error?.message || String(error)}`;
      errorLog('REQUEST_PERMISSION', errorMsg, error);
      addDebugInfo(`❌ ${errorMsg}`);
      addDebugInfo('💡 可能原因: info.plist配置问题、系统限制');
      setLastError(errorMsg);
      
      // Sentry: 权限请求错误
      Sentry.captureException(error, {
        tags: { feature: 'idfa', step: 'request_permission', severity: 'error' },
        contexts: {
          error_debug: {
            possible_causes: ['info.plist配置问题', '系统限制', 'API异常']
          }
        }
      });
    }
    
    console.log('\n========== ✅ 权限请求完成 ==========\n');
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

// 辅助函数：获取权限状态名称
function getStatusName(status: TrackingTransparency.PermissionStatus): string {
  switch (status) {
    case TrackingTransparency.PermissionStatus.GRANTED:
      return '已授权';
    case TrackingTransparency.PermissionStatus.DENIED:
      return '已拒绝';
    case TrackingTransparency.PermissionStatus.UNDETERMINED:
      return '未确定';
    default:
      return `未知状态(${status})`;
  }
}
