import * as Clipboard from 'expo-clipboard';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useDeviceId } from '@/hooks/useDeviceId';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function HomeScreen() {
  const { deviceId, isLoading, error, platform, permissionStatus, requestPermission } = useDeviceId();
  const buttonColor = useThemeColor({}, 'tint');
  const buttonTextColor = useThemeColor({ light: '#FFFFFF', dark: '#FFFFFF' }, 'background');

  const handleCopyToClipboard = async () => {
    if (deviceId) {
      await Clipboard.setStringAsync(deviceId);
      const idType = platform === 'ios' ? 'IDFA' : 'GAID';
      Alert.alert('复制成功', `${idType} 已复制到剪贴板`);
    }
  };

  const getTitle = () => {
    if (platform === 'ios') return 'IDFA:';
    if (platform === 'android') return 'GAID:';
    return '设备ID:';
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>正在获取设备信息...</ThemedText>
        </ThemedView>
      );
    }

    if (deviceId) {
      return (
        <ThemedView style={styles.successContainer}>
          <ThemedText type="subtitle" style={styles.title}>{getTitle()}</ThemedText>
          <ThemedText style={styles.deviceIdText} selectable>{deviceId}</ThemedText>
          <TouchableOpacity
            style={[styles.copyButton, { backgroundColor: buttonColor }]}
            onPress={handleCopyToClipboard}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.copyButtonText, { color: buttonTextColor }]}>复制</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      );
    }

    if (platform === 'ios') {
      switch (permissionStatus) {
        case 'undetermined':
          return (
            <ThemedView style={styles.permissionContainer}>
              <ThemedText type="subtitle" style={styles.title}>需要您的许可</ThemedText>
              <ThemedText style={styles.permissionText}>
                为了帮助我们改进服务和提供更相关的内容，我们希望能获取您设备的广告标识符 (IDFA)。
              </ThemedText>
              <ThemedText style={styles.instructionText}>
                我们承诺将严格保护您的隐私数据。点击“继续”将弹出系统权限请求。
              </ThemedText>
              <TouchableOpacity
                style={[styles.permissionButton, { backgroundColor: buttonColor }]}
                onPress={requestPermission}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.permissionButtonText, { color: buttonTextColor }]}>继续</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          );
        case 'denied':
          return (
            <ThemedView style={styles.errorContainer}>
              <ThemedText type="subtitle" style={styles.title}>IDFA 不可用</ThemedText>
              <ThemedText style={styles.errorText}>
                您已拒绝跟踪权限。IDFA无法获取。您仍然可以正常使用本应用。
              </ThemedText>
              <ThemedText style={styles.instructionText}>
                如需更改，请前往“设置”→“隐私与安全”→“跟踪”中允许本应用跟踪。
              </ThemedText>
            </ThemedView>
          );
      }
    }

    if (error) {
      return (
        <ThemedView style={styles.errorContainer}>
          <ThemedText type="subtitle" style={styles.title}>出现错误</ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      );
    }

    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>未能获取设备ID。</ThemedText>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {renderContent()}
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
