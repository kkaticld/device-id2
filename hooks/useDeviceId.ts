import * as Application from 'expo-application';
import * as TrackingTransparency from 'expo-tracking-transparency';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

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

  const getIds = useCallback(async () => {
    setIsLoading(true);
    
    // Get Application Info (cross-platform)
    setApplicationId(Application.applicationId);
    setNativeVersion(Application.nativeApplicationVersion);
    setNativeBuildVersion(Application.nativeBuildVersion);
    
    // Platform-specific IDs
    if (Platform.OS === 'ios') {
      // iOS: Get IDFV
      const vendorId = await Application.getIosIdForVendorAsync();
      setIdfv(vendorId);
    } else if (Platform.OS === 'android') {
      // Android: Get Android ID
      const deviceId = Application.getAndroidId();
      setAndroidId(deviceId);
    }

    // Get Advertising ID (IDFA on iOS, GAID on Android)
    const { status } = await TrackingTransparency.getTrackingPermissionsAsync();
    setPermissionStatus(status);
    if (status === TrackingTransparency.PermissionStatus.GRANTED) {
      const adId = TrackingTransparency.getAdvertisingId();
      setAdvertisingId(adId);
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getIds();
  }, [getIds]);

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
    setPermissionStatus(status);
    if (status === TrackingTransparency.PermissionStatus.GRANTED) {
      const adId = TrackingTransparency.getAdvertisingId();
      setAdvertisingId(adId);
    }
    setIsLoading(false);
  }, []);

  return { 
    advertisingId, 
    idfv, 
    androidId,
    applicationId,
    nativeVersion,
    nativeBuildVersion,
    isLoading, 
    permissionStatus, 
    requestPermission 
  };
}