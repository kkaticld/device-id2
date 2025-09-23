import * as Application from 'expo-application';
import * as TrackingTransparency from 'expo-tracking-transparency';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface DeviceInfo {
  idfa: string | null;
  idfv: string | null;
  isLoading: boolean;
  permissionStatus: TrackingTransparency.PermissionStatus | null;
  requestPermission: () => Promise<void>;
}

export function useDeviceId(): DeviceInfo {
  const [idfa, setIdfa] = useState<string | null>(null);
  const [idfv, setIdfv] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<TrackingTransparency.PermissionStatus | null>(null);

  const getIds = useCallback(async () => {
    setIsLoading(true);
    // Fetch IDFV unconditionally on iOS
    if (Platform.OS === 'ios') {
      const vendorId = await Application.getIosIdForVendorAsync();
      setIdfv(vendorId);
    }

    // Check and fetch IDFA if permission is already granted
    const { status } = await TrackingTransparency.getTrackingPermissionsAsync();
    setPermissionStatus(status);
    if (status === TrackingTransparency.PermissionStatus.GRANTED) {
      const idfa = TrackingTransparency.getAdvertisingId();
      setIdfa(idfa);
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
      const idfa = TrackingTransparency.getAdvertisingId();
      setIdfa(idfa);
    }
    setIsLoading(false);
  }, []);

  return { idfa, idfv, isLoading, permissionStatus, requestPermission };
}
