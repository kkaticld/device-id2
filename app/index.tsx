import { PermissionStatus } from 'expo-tracking-transparency';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useDeviceId } from '@/hooks/useDeviceId';

export default function HomeScreen() {
  const { 
    advertisingId, 
    idfv, 
    androidId,
    applicationId,
    nativeVersion,
    nativeBuildVersion,
    isLoading, 
    permissionStatus, 
    requestPermission 
  } = useDeviceId();
  
  const [userAgent, setUserAgent] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [isLoadingIp, setIsLoadingIp] = useState(false);

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

  const getUserAgent = () => {
    setShowWebView(true);
  };

  const SettingsGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.settingsGroup}>
      <Text style={styles.groupTitle}>{title.toUpperCase()}</Text>
      <View style={styles.groupContainer}>
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
        !isLast && styles.settingsRowBorder
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {showButton ? (
        <Text style={styles.buttonText}>{buttonTitle}</Text>
      ) : (
        <Text
          style={styles.valueText}
          selectable
          numberOfLines={0}
        >
          {value || '暂无数据'}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderAdvertisingIdRow = () => {
    if (permissionStatus === PermissionStatus.GRANTED && advertisingId) {
      return (
        <SettingsRow
          value={advertisingId}
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
        buttonTitle={Platform.OS === 'ios' ? "Click Get IDFA" : "Click Get GAID"}
        onPress={() => {
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
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>
            正在获取设备信息...
          </Text>
        </View>
      </View>
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
      setShowWebView(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <SettingsGroup title="Application ID">
          <SettingsRow
            value={applicationId}
            isLast={true}
          />
        </SettingsGroup>

        <SettingsGroup title="App Version">
          <SettingsRow
            value={nativeVersion}
            isLast={true}
          />
        </SettingsGroup>

        <SettingsGroup title="Build Version">
          <SettingsRow
            value={nativeBuildVersion}
            isLast={true}
          />
        </SettingsGroup>

        <SettingsGroup title={Platform.OS === 'ios' ? "IDFA" : "GAID"}>
          {renderAdvertisingIdRow()}
        </SettingsGroup>

        <SettingsGroup title={Platform.OS === 'ios' ? "IDFV" : "Android ID"}>
          <SettingsRow
            value={Platform.OS === 'ios' ? idfv : androidId}
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
    </View>
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
  settingsRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
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