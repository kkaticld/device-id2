import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as TrackingTransparency from 'expo-tracking-transparency';

interface DeviceIdResult {
  deviceId: string | null;
  isLoading: boolean;
  error: string | null;
  platform: 'ios' | 'android' | 'web' | 'unknown';
  permissionStatus: 'undetermined' | 'denied' | 'granted' | 'not_applicable';
  requestPermission: () => Promise<void>;
}

export function useDeviceId(): DeviceIdResult {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'undetermined' | 'denied' | 'granted' | 'not_applicable'>('undetermined');

  const platformType = Platform.OS === 'ios' ? 'ios' 
                      : Platform.OS === 'android' ? 'android'
                      : Platform.OS === 'web' ? 'web'
                      : 'unknown';


  const getDeviceId = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[DeviceID] 开始获取设备ID, 平台:', Platform.OS);

      if (Platform.OS === 'web') {
        setPermissionStatus('not_applicable');
        setError('设备广告ID在Web平台不可用');
        setDeviceId(null);
        return;
      }

      let advertisingId: string | null = null;

      if (Platform.OS === 'ios') {
        console.log('[DeviceID] iOS平台，检查TrackingTransparency可用性');
        
        // 检查API是否可用
        const isApiAvailable = TrackingTransparency.isAvailable();
        console.log('[DeviceID] TrackingTransparency API 可用性:', isApiAvailable);
        
        if (!isApiAvailable) {
          setError('当前设备不支持广告跟踪功能');
          setPermissionStatus('not_applicable');
          setDeviceId(null);
          return;
        }

        // iOS 需要请求跟踪权限
        console.log('[DeviceID] 请求iOS跟踪权限');
        const permissionResult = await TrackingTransparency.requestTrackingPermissionsAsync();
        console.log('[DeviceID] 权限请求结果:', permissionResult);
        
        if (permissionResult.status === TrackingTransparency.PermissionStatus.GRANTED) {
          setPermissionStatus('granted');
          console.log('[DeviceID] 权限已授予，开始获取广告ID');
          
          try {
            // 先检查是否是模拟器
            const releaseType = await Application.getIosApplicationReleaseTypeAsync();
            const isSimulator = releaseType === Application.ApplicationReleaseType.SIMULATOR;
            console.log('[DeviceID] iOS应用类型:', releaseType, '是否模拟器:', isSimulator);
            
            if (isSimulator) {
              setError('iOS模拟器不支持获取真实的广告ID，请在真机上测试');
              setDeviceId(null);
              return;
            }
            
            // 在真机上获取广告ID
            advertisingId = TrackingTransparency.getAdvertisingId();
            console.log('[DeviceID] 获取到的广告ID:', advertisingId);
            
            if (advertisingId && advertisingId !== '00000000-0000-0000-0000-000000000000') {
              setDeviceId(advertisingId);
              console.log('[DeviceID] 成功设置设备ID');
            } else {
              setError(`获取到的广告ID无效或被用户在设置中禁用: ${advertisingId || 'null'}`);
              setDeviceId(null);
            }
          } catch (getIdError) {
            console.error('[DeviceID] 获取广告ID时出错:', getIdError);
            setError(`获取广告ID失败: ${getIdError instanceof Error ? getIdError.message : '未知错误'}`);
            setDeviceId(null);
          }
        } else {
          setPermissionStatus('denied');
          console.log('[DeviceID] 用户拒绝了权限请求');
          setError('需要授权才能获取广告ID');
          setDeviceId(null);
        }
      } else if (Platform.OS === 'android') {
        setPermissionStatus('not_applicable'); // Android 不需要显式权限
        console.log('[DeviceID] Android平台，直接获取广告ID');
        
        try {
          advertisingId = TrackingTransparency.getAdvertisingId();
          console.log('[DeviceID] Android 获取到的广告ID:', advertisingId ? '有效ID' : 'null');
          
          if (advertisingId && advertisingId !== '00000000-0000-0000-0000-000000000000') {
            setDeviceId(advertisingId);
          } else {
            setError(`Android设备获取到的广告ID无效或被用户禁用: ${advertisingId || 'null'}`);
            setDeviceId(null);
          }
        } catch (androidError) {
          console.error('[DeviceID] Android获取广告ID出错:', androidError);
          setError(`Android设备无法获取广告ID: ${androidError instanceof Error ? androidError.message : '未知错误'}`);
          setDeviceId(null);
        }
      }
    } catch (err) {
      console.error('[DeviceID] 获取设备ID整体失败:', err);
      setError(`获取失败: ${err instanceof Error ? err.message : '未知错误'}`);
      setDeviceId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async () => {
    if (Platform.OS === 'ios') {
      await getDeviceId();
    }
  };

  useEffect(() => {
    // 初始化时检查权限状态
    const initializePermissions = async () => {
      try {
        console.log('[DeviceID] 初始化权限检查, 平台:', Platform.OS);
        
        if (Platform.OS === 'ios') {
          // 检查API可用性
          const isApiAvailable = TrackingTransparency.isAvailable();
          console.log('[DeviceID] TrackingTransparency API 可用性:', isApiAvailable);
          
          if (!isApiAvailable) {
            setError('当前设备不支持广告跟踪功能（可能是模拟器或系统限制）');
            setPermissionStatus('not_applicable');
            setIsLoading(false);
            return;
          }

          // 先检查当前权限状态，不立即请求
          const permissionResult = await TrackingTransparency.getTrackingPermissionsAsync();
          console.log('[DeviceID] 当前权限状态:', permissionResult);
          
          if (permissionResult.status === TrackingTransparency.PermissionStatus.GRANTED) {
            // 如果已经授权，直接获取广告ID
            setPermissionStatus('granted');
            console.log('[DeviceID] 已有权限，直接获取广告ID');
            
            try {
              // 先检查是否是模拟器
              const releaseType = await Application.getIosApplicationReleaseTypeAsync();
              const isSimulator = releaseType === Application.ApplicationReleaseType.SIMULATOR;
              console.log('[DeviceID] iOS应用类型:', releaseType, '是否模拟器:', isSimulator);
              
              if (isSimulator) {
                setError('iOS模拟器不支持获取真实的广告ID，请在真机上测试');
                return;
              }
              
              const advertisingId = TrackingTransparency.getAdvertisingId();
              console.log('[DeviceID] 直接获取结果:', advertisingId);
              
              if (advertisingId && advertisingId !== '00000000-0000-0000-0000-000000000000') {
                setDeviceId(advertisingId);
              } else {
                setError(`获取到的广告ID无效或被用户在设置中禁用: ${advertisingId || 'null'}`);
              }
            } catch (getIdError) {
              console.error('[DeviceID] 直接获取广告ID失败:', getIdError);
              setError(`获取广告ID失败: ${getIdError instanceof Error ? getIdError.message : '未知错误'}`);
            }
            setIsLoading(false);
          } else if (permissionResult.status === TrackingTransparency.PermissionStatus.DENIED) {
            // 已经拒绝
            setPermissionStatus('denied');
            setError('需要授权才能获取广告ID');
            setIsLoading(false);
          } else {
            // 未决定，请求权限
            console.log('[DeviceID] 权限未决定，请求权限');
            await getDeviceId();
          }
        } else {
          // 非-iOS 平台直接获取
          await getDeviceId();
        }
      } catch (initError) {
        console.error('[DeviceID] 初始化失败:', initError);
        setError(`初始化失败: ${initError instanceof Error ? initError.message : '未知错误'}`);
        setIsLoading(false);
      }
    };

    initializePermissions();
  }, []);

  return {
    deviceId,
    isLoading,
    error,
    platform: platformType,
    permissionStatus,
    requestPermission,
  };
}
