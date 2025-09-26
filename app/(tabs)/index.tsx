import * as Clipboard from 'expo-clipboard';
import { PermissionStatus } from 'expo-tracking-transparency';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useDeviceId } from '@/hooks/useDeviceId';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function HomeScreen() {
  const { idfa, idfv, isLoading, permissionStatus, requestPermission } = useDeviceId();
  const [userAgent, setUserAgent] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [isLoadingIp, setIsLoadingIp] = useState(false);
  const buttonColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({ light: '#f2f2f7', dark: '#000000' }, 'background');
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#6d6d70', dark: '#8e8e93' }, 'text');
  const primaryTextColor = useThemeColor({ light: '#000000', dark: '#ffffff' }, 'text');
  const separatorColor = useThemeColor({ light: '#c6c6c8', dark: '#38383a' }, 'text');

  // 安全的LogRocket追踪函数
  const safeLogRocketTrack = (eventName: string, properties?: Record<string, any>) => {
    try {
      safeLogRocketTrack(eventName, properties);
    } catch (error) {
      console.log(`LogRocket track failed (dev mode): ${eventName}`);
    }
  };

  const handleCopyToClipboard = async (text: string | null) => {
    if (text) {
      await Clipboard.setStringAsync(text);
      
      // LogRocket事件追踪
      safeLogRocketTrack('Copy to Clipboard', {
        contentType: text.includes('idfa') ? 'IDFA' :
                    text.includes('idfv') ? 'IDFV' :
                    text.includes('Mozilla') ? 'UserAgent' :
                    text.match(/^\d+\.\d+\.\d+\.\d+$/) ? 'IP Address' : 'Unknown',
        contentLength: text.length
      });
      
      Alert.alert('已复制', text, [{ text: '好的', style: 'default' }]);
    }
  };

  const getIpAddress = async () => {
    setIsLoadingIp(true);
    safeLogRocketTrack('Get IP Address Started');
    
    try {
      const response = await fetch('https://api.ipify.org/');
      const ip = await response.text();
      setIpAddress(ip);
      
      safeLogRocketTrack('Get IP Address Success', { ipAddress: ip });
    } catch (error) {
      safeLogRocketTrack('Get IP Address Failed', { error: String(error) });
      Alert.alert('获取失败', '无法获取IP地址', [{ text: '好的', style: 'default' }]);
    } finally {
      setIsLoadingIp(false);
    }
  };

  const getUserAgent = () => {
    safeLogRocketTrack('Get UserAgent Started');
    setShowWebView(true);
  };

  // 应用启动时的LogRocket事件
  useEffect(() => {
    safeLogRocketTrack('App Started', {
      platform: Platform.OS,
      version: Platform.Version
    });
  }, []);

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
        <ThemedText style={[styles.accessoryText, { color: secondaryTextColor }]}>Copy</ThemedText>
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
          value=""
          showButton={true}
          buttonTitle="Go to Settings"
          onPress={() => {
            safeLogRocketTrack('IDFA Permission Denied - Settings Prompt');
            Alert.alert('权限被拒绝', '请到设置中开启跟踪权限', [{ text: '好的', style: 'default' }]);
          }}
          isLast={true}
        />
      );
    }
    
    return (
      <SettingsRow
        value=""
        showButton={true}
        buttonTitle="Click Get IDFA"
        onPress={() => {
          safeLogRocketTrack('IDFA Permission Request Started');
          requestPermission();
        }}
        isLast={true}
      />
    );
  };

  const renderUserAgentRow = () => {
    if (userAgent) {
      return (
        <SettingsRow
          value={userAgent}
          onPress={() => handleCopyToClipboard(userAgent)}
          isLast={true}
        />
      );
    }
    
    return (
      <SettingsRow
        value=""
        showButton={true}
        buttonTitle="Click Get UserAgent"
        onPress={getUserAgent}
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
      
      safeLogRocketTrack('Get UserAgent Success', {
        userAgent: realUserAgent,
        platform: Platform.OS
      });
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
          {renderUserAgentRow()}
        </SettingsGroup>

        <SettingsGroup title="IP">
          {renderIpRow()}
        </SettingsGroup>
      </ScrollView>
      
      {/* WebView放在完全隐藏的容器中，完全不影响布局 */}
      <View style={styles.hiddenContainer}>
        {showWebView && (
          <WebView
            source={{ html: webViewHtml }}
            style={styles.hiddenWebView}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
          />
        )}
      </View>
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
  hiddenContainer: {
    position: 'absolute',
    top: -10000,
    left: -10000,
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
  hiddenWebView: {
    width: 1,
    height: 1,
    opacity: 0,
  },
});
