import { StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useDeviceId } from '@/hooks/useDeviceId';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function HomeScreen() {
  const { deviceId, isLoading, error, platform, permissionStatus, requestPermission } = useDeviceId();
  const buttonColor = useThemeColor({}, 'tint');
  const buttonTextColor = useThemeColor({ light: '#FFFFFF', dark: '#FFFFFF' }, 'background');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const handleCopyToClipboard = async () => {
    if (deviceId) {
      await Clipboard.setStringAsync(deviceId);
      const idType = platform === 'ios' ? 'IDFA' : 'GAID';
      Alert.alert('复制成功', `${idType} 已复制到剪贴板`);
    }
  };

  const getTitle = () => {
    if (platform === 'ios') return 'IDFA:';
    return 'GAID:';
  };

  const handleRequestPermission = async () => {
    try {
      setIsRequestingPermission(true);
      await requestPermission();
    } catch (err) {
      console.error('请求权限失败:', err);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {isLoading || isRequestingPermission ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>
            {isRequestingPermission ? '请求权限中...' : '正在获取设备ID...'}
          </ThemedText>
        </ThemedView>
      ) : deviceId ? (
        <ThemedView style={styles.successContainer}>
          <ThemedText type="subtitle" style={styles.title}>
            {getTitle()}
          </ThemedText>
          <ThemedText style={styles.deviceIdText} selectable>
            {deviceId}
          </ThemedText>
          <TouchableOpacity 
            style={[styles.copyButton, { backgroundColor: buttonColor }]}
            onPress={handleCopyToClipboard}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.copyButtonText, { color: buttonTextColor }]}>复制</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ) : permissionStatus === 'denied' && platform === 'ios' ? (
        <ThemedView style={styles.permissionContainer}>
          <ThemedText type="subtitle" style={styles.title}>
            IDFA:
          </ThemedText>
          <ThemedText style={styles.permissionText}>
            需要在设置中手动开启跟踪权限
          </ThemedText>
          <ThemedText style={styles.instructionText}>
            请打开 设置 → 隐私与安全 → 跟踪 → 开启本应用的跟踪权限
          </ThemedText>
          <TouchableOpacity 
            style={[styles.permissionButton, { backgroundColor: buttonColor }]}
            onPress={handleRequestPermission}
            activeOpacity={0.7}
            disabled={isRequestingPermission}
          >
            <ThemedText style={[styles.permissionButtonText, { color: buttonTextColor }]}>
              重试获取
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ) : error ? (
        <ThemedView style={styles.errorContainer}>
          <ThemedText type="subtitle" style={styles.title}>
            {getTitle()}
          </ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          {platform === 'ios' && permissionStatus === 'denied' && (
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: buttonColor }]}
              onPress={handleRequestPermission}
              activeOpacity={0.7}
              disabled={isRequestingPermission}
            >
              <ThemedText style={[styles.retryButtonText, { color: buttonTextColor }]}>
                重新授权
              </ThemedText>
            </TouchableOpacity>
          )}
          {error.includes('模拟器') && (
            <ThemedText style={styles.simulatorHint}>
              📱 请在真实的iOS设备上测试以获取真实的IDFA
            </ThemedText>
          )}
        </ThemedView>
      ) : (
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>未获取到设备ID</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deviceIdText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  copyButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  permissionContainer: {
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 20,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.6,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  simulatorHint: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.7,
    lineHeight: 20,
  },
});
