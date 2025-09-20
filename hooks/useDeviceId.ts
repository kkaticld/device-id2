import * as Application from 'expo-application';
import * as TrackingTransparency from 'expo-tracking-transparency';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

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

  const getAdvertisingId = async () => {
    console.log('[DeviceID] Attempting to get Advertising ID');
    try {
      // This function should only be called after permission is granted on iOS
      const isSimulator = Platform.OS === 'ios' && (await Application.getIosApplicationReleaseTypeAsync()) === Application.ApplicationReleaseType.SIMULATOR;
      if (isSimulator) {
        setError('iOS模拟器不支持获取真实的广告ID，请在真机上测试');
        setDeviceId(null);
        return;
      }

      const id = TrackingTransparency.getAdvertisingId();
      console.log('[DeviceID] Got ID:', id);
      if (id && id !== '00000000-0000-0000-0000-000000000000') {
        setDeviceId(id);
      } else {
        // This can happen if user disables tracking in system settings after granting permission
        setError('广告ID不可用。请检查系统设置中的“跟踪”权限。');
        setDeviceId(null);
      }
    } catch (e) {
      console.error('[DeviceID] Error getting advertising ID:', e);
      setError(`获取广告ID失败: ${e instanceof Error ? e.message : '未知错误'}`);
      setDeviceId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async () => {
    console.log('[DeviceID] Requesting tracking permission');
    setIsLoading(true);
    try {
      const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
      console.log('[DeviceID] Permission status after request:', status);
      setPermissionStatus(status);
      if (status === 'granted') {
        await getAdvertisingId();
      } else {
        // If denied or undetermined, just update status and stop loading.
        // The UI will show the appropriate message. A denied permission is not an error.
        setDeviceId(null);
        setIsLoading(false);
      }
    } catch (e) {
      console.error('[DeviceID] Error requesting permission:', e);
      setError(`请求权限时出错: ${e instanceof Error ? e.message : '未知错误'}`);
      setDeviceId(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkInitialStatus = async () => {
      setIsLoading(true);
      console.log('[DeviceID] Initializing, platform:', Platform.OS);

      if (Platform.OS === 'web') {
        setPermissionStatus('not_applicable');
        setError('设备广告ID在Web平台不可用');
        setIsLoading(false);
        return;
      }
      
      if (Platform.OS === 'android') {
        setPermissionStatus('not_applicable'); // No explicit permission needed
        try {
          const id = TrackingTransparency.getAdvertisingId();
          if (id && id !== '00000000-0000-0000-0000-000000000000') {
            setDeviceId(id);
          } else {
            setError('Android设备获取到的广告ID无效或被用户禁用');
          }
        } catch (e) {
          setError(`Android设备无法获取广告ID: ${e instanceof Error ? e.message : '未知错误'}`);
        }
        setIsLoading(false);
        return;
      }

      // iOS specific logic
      if (!TrackingTransparency.isAvailable()) {
        setError('当前设备不支持广告跟踪功能');
        setPermissionStatus('not_applicable');
        setIsLoading(false);
        return;
      }

      try {
        const { status } = await TrackingTransparency.getTrackingPermissionsAsync();
        console.log('[DeviceID] Initial permission status:', status);
        setPermissionStatus(status);

        if (status === 'granted') {
          await getAdvertisingId();
        } else {
          // For 'denied' or 'undetermined', we do nothing.
          // The UI will show the pre-prompt for 'undetermined' or a message for 'denied'.
          setIsLoading(false);
        }
      } catch (e) {
        console.error('[DeviceID] Error checking initial status:', e);
        setError(`检查初始权限状态失败: ${e instanceof Error ? e.message : '未知错误'}`);
        setIsLoading(false);
      }
    };

    checkInitialStatus();
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
