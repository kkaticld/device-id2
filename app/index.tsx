import LogRocket from '@logrocket/react-native';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { PermissionStatus } from 'expo-tracking-transparency';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useDeviceId } from '@/hooks/useDeviceId';
import { useI18n } from '../utils/i18n';

export default function HomeScreen() {
  const { t } = useI18n();
  const { idfa, idfv, isLoading, permissionStatus, requestPermission } = useDeviceId();
  const [userAgent, setUserAgent] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [isLoadingIp, setIsLoadingIp] = useState(false);
  const [logRocketLogs, setLogRocketLogs] = useState<string[]>([]);
  // 牛油果主题颜色方案
  const colors = {
    avocadoGreen: '#9ACD32',   // 牛油果绿 - 按钮和强调色
    deepBlack: '#000000',      // 深黑色 - 主背景
    lightGreen: '#C7EA46',     // 浅牛油果绿 - 高亮
    darkGray: '#1a1a1a',       // 深灰色 - 卡片背景
    lightText: '#ffffff',      // 白色文字
    grayText: '#888888',       // 灰色次要文字
  };
  
  const buttonColor = colors.avocadoGreen;
  const backgroundColor = colors.deepBlack;
  const cardColor = colors.darkGray;
  const secondaryTextColor = colors.grayText;
  const primaryTextColor = colors.lightText;
  const separatorColor = '#333333';  // 深灰色分隔线

  // 添加日志到状态
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogRocketLogs(prev => [...prev, logMessage].slice(-10)); // 只保留最新10条
    console.log(logMessage);
  };

  // 安全的LogRocket追踪函数
  const safeLogRocketTrack = (eventName: string, properties?: Record<string, any>) => {
    addLog(`🚀 LogRocket.track('${eventName}') 开始`);
    try {
      LogRocket.track(eventName, properties);
      addLog(`✅ LogRocket.track('${eventName}') 成功`);
    } catch (error) {
      addLog(`❌ LogRocket.track('${eventName}') 失败: ${String(error)}`);
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
      
      Alert.alert(t.copied, text, [{ text: t.ok, style: 'default' }]);
    }
  };

  // 分享功能
  const handleShare = async () => {
    const deviceInfo = {
      IDFA: idfa || t.shareContent.notObtained,
      IDFV: idfv || t.shareContent.notObtained,
      UserAgent: userAgent || t.shareContent.notObtained,
      IPAddress: ipAddress || t.shareContent.notObtained,
      Platform: Platform.OS,
      Timestamp: new Date().toLocaleString()
    };

    const shareText = `${t.shareContent.title}\n\n${t.shareContent.idfa}: ${deviceInfo.IDFA}\n${t.shareContent.idfv}: ${deviceInfo.IDFV}\n${t.shareContent.userAgent}: ${deviceInfo.UserAgent}\n${t.shareContent.ipAddress}: ${deviceInfo.IPAddress}\n${t.shareContent.platform}: ${deviceInfo.Platform}\n${t.shareContent.timestamp}: ${deviceInfo.Timestamp}`;

    try {
      safeLogRocketTrack('Share Device Info Started');
      
      if (await Sharing.isAvailableAsync()) {
        // 创建临时文件分享
        const fileName = `device_info_${Date.now()}.txt`;
        await Sharing.shareAsync(shareText, {
          mimeType: 'text/plain',
          dialogTitle: t.shareTitle
        });
        safeLogRocketTrack('Share Device Info Success');
      } else {
        // 降级到复制到剪贴板
        await Clipboard.setStringAsync(shareText);
        Alert.alert(t.copiedToClipboard, t.canPasteToOtherApps, [{ text: t.ok, style: 'default' }]);
        safeLogRocketTrack('Share Device Info Fallback to Clipboard');
      }
    } catch (error) {
      safeLogRocketTrack('Share Device Info Failed', { error: String(error) });
      Alert.alert(t.shareFailed, t.retryLater, [{ text: t.ok, style: 'default' }]);
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
    buttonTitle = "", 
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
        { backgroundColor: cardColor, borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth, borderBottomColor: separatorColor }
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {showButton ? (
        <ThemedText style={[styles.buttonText, { color: buttonColor }]}>
          {buttonTitle}
        </ThemedText>
      ) : (
        <ThemedText 
          style={[styles.valueText, { color: primaryTextColor }]}
          selectable
          numberOfLines={0}
        >
          {value || '{t.noData}'}
        </ThemedText>
      )}
      {/* Copy按钮已隐藏，但保留复制功能 */}
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
          buttonTitle="{t.goToSettings}"
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
        buttonTitle="{t.clickGetIdfa}"
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
        buttonTitle="{t.clickGetUserAgent}"
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
        buttonTitle={isLoadingIp ? t.gettingIP : t.clickGetIP}
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
            {t.gettingDeviceInfo}
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

        {/* LogRocket 日志区域 - 暂时注释
        <SettingsGroup title="LogRocket 日志">
          <View style={[styles.groupContainer, { backgroundColor: cardColor }]}>
            <ScrollView style={styles.logContainer} showsVerticalScrollIndicator={false}>
              {logRocketLogs.length === 0 ? (
                <ThemedText style={[styles.logText, { color: secondaryTextColor }]}>
                  暂无日志...
                </ThemedText>
              ) : (
                logRocketLogs.map((log, index) => (
                  <ThemedText key={index} style={[styles.logText, { color: primaryTextColor }]}>
                    {log}
                  </ThemedText>
                ))
              )}
            </ScrollView>
          </View>
        </SettingsGroup>
        */}
      </ScrollView>
      
      {/* 底部工具栏 */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.shareButtonText, { color: colors.deepBlack }]}>
            Share
          </ThemedText>
        </TouchableOpacity>
      </View>
      
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
  logContainer: {
    maxHeight: 120,
    padding: 12,
  },
  logText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
    lineHeight: 18,
    marginBottom: 4,
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
  toolbar: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    backgroundColor: '#9ACD32', // 牛油果绿
    borderRadius: 10, // iOS系统按钮圆角规格
    paddingVertical: 8, // 减半高度
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 10,
    shadowOpacity: 0.1,
    elevation: 5,
    height: 44, // iOS标准按钮高度
  },
  shareButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});