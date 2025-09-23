import * as Clipboard from 'expo-clipboard';
import { PermissionStatus } from 'expo-tracking-transparency';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useDeviceId } from '@/hooks/useDeviceId';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function HomeScreen() {
  const { idfa, idfv, isLoading, permissionStatus, requestPermission } = useDeviceId();
  const [userAgent, setUserAgent] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(true);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [isLoadingIp, setIsLoadingIp] = useState(false);
  const buttonColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({ light: '#f2f2f7', dark: '#000000' }, 'background');
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#6d6d70', dark: '#8e8e93' }, 'text');
  const primaryTextColor = useThemeColor({ light: '#000000', dark: '#ffffff' }, 'text');
  const separatorColor = useThemeColor({ light: '#c6c6c8', dark: '#38383a' }, 'text');

  const handleCopyToClipboard = async (text: string | null) => {
    if (text) {
      await Clipboard.setStringAsync(text);
      Alert.alert('已复制', text, [{ text: '好的', style: 'default' }]);
    }
  };

  const getIpAddress = async () => {
    setIsLoadingIp(true);
    try {
      const response = await fetch('https://api.ipify.org/');
      const ip = await response.text();
      setIpAddress(ip);
    } catch (error) {
      Alert.alert('获取失败', '无法获取IP地址', [{ text: '好的', style: 'default' }]);
    } finally {
      setIsLoadingIp(false);
    }
  };

  const SettingsGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.settingsGroup}>
      <ThemedText style={[styles.groupTitle, { color: secondaryTextColor }]}>{title.toUpperCase()}</ThemedText>
      <View style={[styles.groupContainer, { backgroundColor: cardColor }]}>
        {children}
      </View>
    </View>
  );

  const SettingsRow = ({ 
    value, 
    onPress, 
    showButton = false, 
    buttonTitle = "获取授权",
    isLast = false 
  }: { 
    value: string | null; 
    onPress?: () => void;
    showButton?: boolean;
    buttonTitle?: string;
    isLast?: boolean;
  }) => (
    <TouchableOpacity 
      style={[
        styles.settingsRow, 
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: separatorColor }
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {showButton ? (
        <ThemedText style={[styles.buttonText, { color: buttonColor }]}>{buttonTitle}</ThemedText>
      ) : (
        <ThemedText 
          style={[styles.valueText, { color: primaryTextColor }]} 
          selectable
          numberOfLines={0}
        >
          {value || '暂无数据'}
        </ThemedText>
      )}
      {onPress && !showButton && (
        <ThemedText style={[styles.accessoryText, { color: secondaryTextColor }]}>拷贝</ThemedText>
      )}
    </TouchableOpacity>
  );

  const renderIdfaRow = () => {
    if (permissionStatus === PermissionStatus.GRANTED && idfa) {
      return (
        <SettingsRow
          value={idfa}
          onPress={() => handleCopyToClipboard(idfa)}
          isLast={true}
        />
      );
    }
    
    if (permissionStatus === PermissionStatus.DENIED) {
      return (
        <SettingsRow
          value="权限被拒绝"
          isLast={true}
        />
      );
    }
    
    return (
      <SettingsRow
        value=""
        showButton={true}
        buttonTitle="Click Get IDFA"
        onPress={requestPermission}
        isLast={true}
      />
    );
  };

  const renderIpRow = () => {
    if (ipAddress) {
      return (
        <SettingsRow
          value={ipAddress}
          onPress={() => handleCopyToClipboard(ipAddress)}
          isLast={true}
        />
      );
    }
    
    return (
      <SettingsRow
        value=""
        showButton={true}
        buttonTitle={isLoadingIp ? "获取中..." : "Click Get IP"}
        onPress={isLoadingIp ? undefined : getIpAddress}
        isLast={true}
      />
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={buttonColor} />
          <ThemedText style={[styles.loadingText, { color: secondaryTextColor }]}>
            正在获取设备信息...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const webViewHtml = `
    <html>
      <head><title>UserAgent</title></head>
      <body>
        <script>
          window.ReactNativeWebView.postMessage(navigator.userAgent);
        </script>
      </body>
    </html>
  `;

  const handleWebViewMessage = (event: any) => {
    const realUserAgent = event.nativeEvent.data;
    if (realUserAgent) {
      setUserAgent(realUserAgent);
      setShowWebView(false); // 获取到UserAgent后立即隐藏WebView
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <SettingsGroup title="IDFA">
          {renderIdfaRow()}
        </SettingsGroup>

        <SettingsGroup title="IDFV">
          <SettingsRow
            value={idfv}
            onPress={() => handleCopyToClipboard(idfv)}
            isLast={true}
          />
        </SettingsGroup>

        <SettingsGroup title="UserAgent">
          <SettingsRow
            value={userAgent}
            onPress={() => handleCopyToClipboard(userAgent)}
            isLast={true}
          />
        </SettingsGroup>

        <SettingsGroup title="IP">
          {renderIpRow()}
        </SettingsGroup>
      </ScrollView>
      
      {/* WebView放在最后，作为不可见节点，避免影响页面渲染和布局 */}
      {showWebView && (
        <WebView
          source={{ html: webViewHtml }}
          style={{ height: 0, width: 0, position: 'absolute', left: -1000, top: -1000, opacity: 0 }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  settingsGroup: {
    marginTop: 35,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '400',
    marginLeft: 16,
    marginBottom: 6,
    letterSpacing: -0.08,
  },
  groupContainer: {
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  settingsRow: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueText: {
    fontSize: 17,
    fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
    flex: 1,
    lineHeight: 22,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '400',
  },
  accessoryText: {
    fontSize: 17,
    fontWeight: '400',
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 17,
    fontWeight: '400',
  },
});
