import * as Application from 'expo-application';
import * as TrackingTransparency from 'expo-tracking-transparency';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface DeviceIdResult {
  idfa: string | null;
  idfv: string | null;
  isLoading: boolean;
  error: string | null;
  platform: 'ios' | 'android' | 'web' | 'unknown';
  permissionStatus: 'undetermined' | 'denied' | 'granted' | 'not_applicable';
  requestPermission: () => Promise<void>;
}

export function useDeviceId(): DeviceIdResult {
  const [idfa, setIdfa] = useState<string | null>(null);
  const [idfv, setIdfv] = useState<string | null>(null);
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
      const id = TrackingTransparency.getAdvertisingId();
      console.log('[DeviceID] Got IDFA:', id);
      if (id && id !== '00000000-0000-0000-0000-000000000000') {
        setIdfa(id);
      } else {
        setIdfa(null);
      }
    } catch (e) {
      console.error('[DeviceID] Error getting advertising ID:', e);
      setError(`获取广告ID失败: ${e instanceof Error ? e.message : '未知错误'}`);
      setIdfa(null);
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
      }
    } catch (e) {
      console.error('[DeviceID] Error requesting permission:', e);
      setError(`请求权限时出错: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadDeviceData = async () => {
      setIsLoading(true);
      setError(null);
      console.log('[DeviceID] Initializing, platform:', Platform.OS);

      // Get non-permission based data first
      try {
        if (Platform.OS === 'ios') {
          const vendorId = await Application.getIosIdForVendorAsync();
          setIdfv(vendorId);
        }
      } catch (e) {
        console.error('[DeviceID] Error getting IDFV:', e);
      }

      // Handle IDFA/GAID
      if (Platform.OS === 'web') {
        setPermissionStatus('not_applicable');
        setError('广告ID在Web平台不可用');
      } else if (Platform.OS === 'android') {
        setPermissionStatus('not_applicable');
        try {
          const id = TrackingTransparency.getAdvertisingId();
          if (id && id !== '00000000-0000-0000-0000-000000000000') {
            setIdfa(id);
          }
        } catch (e) {
          console.error(`Android设备无法获取广告ID: ${e instanceof Error ? e.message : '未知错误'}`);
        }
      } else if (Platform.OS === 'ios') {
        if (!TrackingTransparency.isAvailable()) {
          setError('当前设备不支持广告跟踪功能');
          setPermissionStatus('not_applicable');
        } else {
          try {
            const { status } = await TrackingTransparency.getTrackingPermissionsAsync();
            console.log('[DeviceID] Initial permission status:', status);
            setPermissionStatus(status);
            if (status === 'granted') {
              await getAdvertisingId();
            }
          } catch (e) {
            console.error('[DeviceID] Error checking initial status:', e);
            setError(`检查初始权限状态失败: ${e instanceof Error ? e.message : '未知错误'}`);
          }
        }
      }
      
      setIsLoading(false);
    };

    loadDeviceData();
  }, []);

  return {
    idfa,
    idfv,
    isLoading,
    error,
    platform: platformType,
    permissionStatus,
    requestPermission,
  };
}
