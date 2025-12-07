import { PermissionStatus } from 'expo-tracking-transparency';
import { useState, useMemo, useEffect } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, ImageBackground, Image, Share, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Sentry from '@sentry/react-native';

import { useDeviceId } from '@/hooks/useDeviceId';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  
  // Sentry: 页面加载追踪
  useEffect(() => {
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: '进入首页',
      level: 'info',
    });
  }, []);
  
  // Sentry: 应用状态追踪
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      Sentry.addBreadcrumb({
        category: 'app_state',
        message: `应用状态变化: ${nextAppState}`,
        data: { state: nextAppState },
        level: 'info',
      });
    });

    return () => {
      subscription.remove();
    };
  }, []);
  
  // 使用 useMemo 确保图片 URL 在组件生命周期内保持不变
  const HERO_BG = useMemo(() => ({ uri: `https://picsum.photos/800/1000?t=${Date.now()}` }), []);
  const APP_ICON_IMG = useMemo(() => ({ uri: `https://picsum.photos/200/200?t=${Date.now() + 1}` }), []);
  const FEATURE_IMG = useMemo(() => ({ uri: `https://picsum.photos/800/600?t=${Date.now() + 2}` }), []);
  
  const { 
    advertisingId, 
    idfv, 
    androidId,
    applicationId,
    nativeVersion,
    nativeBuildVersion,
    isLoading, 
    permissionStatus, 
    requestPermission,
    debugInfo,
    lastError,
  } = useDeviceId();
  
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  const [userAgent, setUserAgent] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [ipLocation, setIpLocation] = useState<string | null>(null);
  const [isLoadingIp, setIsLoadingIp] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    showToast('已复制');
  };

  const getIpAddress = async () => {
    setIsLoadingIp(true);
    try {
      const response = await fetch('https://api.live.bilibili.com/xlive/web-room/v1/index/getIpInfo');
      const json = await response.json();
      
      // 解析 Bilibili API 响应
      if (json.code === 0 && json.data) {
        const { addr, country } = json.data;
        setIpAddress(addr || null);
        setIpLocation(country || null);
      } else {
        Alert.alert('获取失败', '无法解析IP地址');
      }
    } catch (error) {
      Alert.alert('获取失败', '无法获取IP地址');
    } finally {
      setIsLoadingIp(false);
    }
  };

  const getUserAgent = () => {
    setShowWebView(true);
  };

  const handleShare = async () => {
    try {
      Sentry.addBreadcrumb({
        category: 'user_action',
        message: '用户点击分享按钮',
        level: 'info',
      });
      
      const deviceInfo = {
        'Application ID': applicationId,
        'App Version': nativeVersion,
        'Build Version': nativeBuildVersion,
        [Platform.OS === 'ios' ? 'IDFA' : 'GAID']: advertisingId || '未获取',
        [Platform.OS === 'ios' ? 'IDFV' : 'Android ID']: Platform.OS === 'ios' ? idfv : androidId,
        'UserAgent': userAgent || '未获取',
        'IP Address': ipAddress || '未获取',
      };

      const message = Object.entries(deviceInfo)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

      await Share.share({
        message: `Device ID Information\n\n${message}`,
        title: 'Device ID Information'
      });
    } catch (error) {
      console.error('Share error:', error);
      Sentry.captureException(error, {
        tags: { feature: 'share' },
      });
    }
  };
  
  // 报告问题到 Sentry
  const reportIssue = () => {
    Sentry.addBreadcrumb({
      category: 'user_action',
      message: '用户点击报告问题按钮',
      level: 'info',
    });
    
    const eventId = Sentry.captureMessage('用户报告 IDFA 问题', {
      level: 'info',
      tags: {
        feature: 'idfa',
        user_reported: true,
        platform: Platform.OS,
      },
      contexts: {
        debug_info: {
          logs: debugInfo.slice(-20), // 最后20条日志
          permission_status: permissionStatus,
          has_idfa: !!advertisingId,
          has_idfv: !!idfv,
          last_error: lastError,
        },
        device_state: {
          app_version: nativeVersion,
          build_version: nativeBuildVersion,
          bundle_id: applicationId,
        }
      }
    });
    
    showToast('问题已报告到 Sentry (ID: ' + eventId?.substring(0, 8) + ')');
  };

  // --- Components ---

  const DateHeader = () => {
    return (
      <View style={styles.dateHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.dateTitle}>Device ID</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareIcon}>↗</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const HeroCard = () => {
    const id = Platform.OS === 'ios' ? advertisingId : advertisingId;
    const title = Platform.OS === 'ios' ? "IDFA" : "GAID";
    const hasPermission = permissionStatus === PermissionStatus.GRANTED;

    return (
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => id && copyToClipboard(id)}
        style={[styles.cardContainer, styles.heroCard]}
      >
        <ImageBackground source={HERO_BG} style={styles.heroImage} imageStyle={{ borderRadius: 14 }}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroSubtitle}>DEVICE IDENTIFIER</Text>
              <Text style={styles.heroTitle}>{title}</Text>
              <Text style={styles.heroDescription} numberOfLines={2}>
                {hasPermission ? (id || '获取中...') : '需要权限以获取标识符'}
              </Text>
              
              {!hasPermission && (
                <TouchableOpacity 
                  style={styles.heroButton}
                  onPress={(e: any) => {
                    e.stopPropagation();
                    requestPermission();
                  }}
                >
                  <Text style={styles.heroButtonText}>获取权限</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  const AppInfoCard = () => {
    const items = [
      { label: 'Bundle ID', value: applicationId },
      { label: 'Version', value: nativeVersion },
      { label: 'Build', value: nativeBuildVersion },
      { label: Platform.OS === 'ios' ? 'IDFV' : 'Android ID', value: Platform.OS === 'ios' ? idfv : androidId },
    ];

    return (
      <View style={[styles.cardContainer, styles.listCard]}>
        <View style={styles.listHeader}>
          <Image source={APP_ICON_IMG} style={styles.listIcon} />
          <View style={styles.listHeaderText}>
            <Text style={styles.listTitle}>应用信息</Text>
            <Text style={styles.listSubtitle}>基础配置参数</Text>
          </View>
          <TouchableOpacity style={styles.listActionBtn} onPress={() => copyToClipboard(JSON.stringify(items))}>
             <Text style={styles.listActionText}>复制全部</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.listContent}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.listItem}
              onPress={() => item.value && copyToClipboard(item.value)}
            >
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemLabel}>{item.label}</Text>
                <Text style={styles.listItemValue} numberOfLines={1}>{item.value || '-'}</Text>
              </View>
              <TouchableOpacity style={styles.copyButton} onPress={() => item.value && copyToClipboard(item.value)}>
                <Text style={styles.copyButtonText}>复制</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const FeatureCard = ({ title, subtitle, value, action, actionLabel, isLoading }: any) => (
    <View style={[styles.cardContainer, styles.featureCard]}>
      <ImageBackground source={FEATURE_IMG} style={styles.featureImage} imageStyle={{ borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
        <View style={styles.featureTag}>
          <Text style={styles.featureTagText}>NETWORK</Text>
        </View>
      </ImageBackground>
      <View style={styles.featureContent}>
        <Text style={styles.featureSubtitle}>{subtitle}</Text>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureValue} numberOfLines={2}>
          {value || '点击获取数据'}
        </Text>
        
        <View style={styles.featureButtonContainer}>
          {!value ? (
            <TouchableOpacity style={styles.featureButton} onPress={action}>
              <Text style={styles.featureButtonText}>{isLoading ? '获取中...' : actionLabel}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.featureButton} onPress={() => copyToClipboard(value)}>
              <Text style={styles.featureButtonText}>复制</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
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
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <DateHeader />
        
        <HeroCard />
        
        <AppInfoCard />
        
        <FeatureCard 
          title="User Agent"
          subtitle="浏览器标识"
          value={userAgent}
          action={getUserAgent}
          actionLabel="获取 UA"
        />

        <FeatureCard
          title="IP Address"
          subtitle="网络地址"
          value={ipAddress ? `${ipAddress}${ipLocation ? ` (${ipLocation})` : ''}` : null}
          action={getIpAddress}
          actionLabel="获取 IP"
          isLoading={isLoadingIp}
        />

        {/* 调试面板 */}
        <View style={[styles.cardContainer, styles.debugCard]}>
          <TouchableOpacity 
            style={styles.debugHeader} 
            onPress={() => setShowDebugPanel(!showDebugPanel)}
          >
            <Text style={styles.debugTitle}>🔧 调试信息</Text>
            <Text style={styles.debugToggle}>{showDebugPanel ? '收起 ▲' : '展开 ▼'}</Text>
          </TouchableOpacity>
          
          {lastError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>❌ 错误: {lastError}</Text>
            </View>
          )}
          
          {showDebugPanel && (
            <View style={styles.debugContent}>
              <View style={styles.debugStatusRow}>
                <Text style={styles.debugLabel}>权限状态:</Text>
                <Text style={[
                  styles.debugValue,
                  permissionStatus === PermissionStatus.GRANTED ? styles.statusGranted :
                  permissionStatus === PermissionStatus.DENIED ? styles.statusDenied :
                  styles.statusUndetermined
                ]}>
                  {permissionStatus === PermissionStatus.GRANTED ? '✅ 已授权' :
                   permissionStatus === PermissionStatus.DENIED ? '❌ 已拒绝' :
                   permissionStatus === PermissionStatus.UNDETERMINED ? '⏳ 未确定' :
                   `未知(${permissionStatus})`}
                </Text>
              </View>
              
              <View style={styles.debugStatusRow}>
                <Text style={styles.debugLabel}>IDFA:</Text>
                <Text style={styles.debugValue} numberOfLines={1}>
                  {advertisingId || '未获取'}
                </Text>
              </View>
              
              {Platform.OS === 'ios' && (
                <View style={styles.debugStatusRow}>
                  <Text style={styles.debugLabel}>IDFV:</Text>
                  <Text style={styles.debugValue} numberOfLines={1}>
                    {idfv || '未获取'}
                  </Text>
                </View>
              )}
              
              {/* 故障排除指南 */}
              {!advertisingId && permissionStatus === PermissionStatus.GRANTED && (
                <View style={styles.troubleshootBox}>
                  <Text style={styles.troubleshootTitle}>🔍 故障排除</Text>
                  <Text style={styles.troubleshootText}>权限已授予但IDFA为空，请检查：</Text>
                  <Text style={styles.troubleshootItem}>1. 是否在真机上测试（模拟器不支持IDFA）</Text>
                  <Text style={styles.troubleshootItem}>2. 设置 → 隐私 → Apple广告 → 个性化广告是否关闭</Text>
                  <Text style={styles.troubleshootItem}>3. 设置 → 隐私 → 跟踪 → 本App是否开启</Text>
                  <Text style={styles.troubleshootItem}>4. 尝试重启App或重新授权</Text>
                </View>
              )}
              
              {permissionStatus === PermissionStatus.DENIED && (
                <View style={styles.troubleshootBox}>
                  <Text style={styles.troubleshootTitle}>💡 如何开启权限</Text>
                  <Text style={styles.troubleshootItem}>1. 打开"设置"App</Text>
                  <Text style={styles.troubleshootItem}>2. 下滑找到本App (Device ID)</Text>
                  <Text style={styles.troubleshootItem}>3. 点击进入App设置</Text>
                  <Text style={styles.troubleshootItem}>4. 开启"允许跟踪"选项</Text>
                  <Text style={styles.troubleshootItem}>5. 返回App重新获取</Text>
                </View>
              )}
              
              {permissionStatus === PermissionStatus.UNDETERMINED && (
                <View style={styles.troubleshootBox}>
                  <Text style={styles.troubleshootTitle}>📌 提示</Text>
                  <Text style={styles.troubleshootText}>点击上方"获取权限"按钮请求授权</Text>
                </View>
              )}
              
              <Text style={styles.debugSectionTitle}>📋 详细日志:</Text>
              <ScrollView style={styles.debugLogScroll} nestedScrollEnabled>
                {debugInfo.map((info, index) => (
                  <Text key={index} style={styles.debugLogText}>{info}</Text>
                ))}
                {debugInfo.length === 0 && (
                  <Text style={styles.debugLogText}>暂无日志</Text>
                )}
              </ScrollView>
              
              <View style={styles.debugButtonsRow}>
                <TouchableOpacity
                  style={[styles.debugActionBtn, styles.debugCopyBtn]}
                  onPress={() => copyToClipboard(debugInfo.join('\n'))}
                >
                  <Text style={styles.debugCopyText}>📋 复制日志</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.debugActionBtn, styles.debugRefreshBtn]}
                  onPress={() => {
                    Sentry.addBreadcrumb({
                      category: 'user_action',
                      message: '用户点击重新检测按钮',
                      level: 'info',
                    });
                    requestPermission();
                  }}
                >
                  <Text style={styles.debugRefreshText}>🔄 重新检测</Text>
                </TouchableOpacity>
              </View>
              
              {/* 报告问题按钮 */}
              {(lastError || (!advertisingId && permissionStatus === PermissionStatus.GRANTED)) && (
                <TouchableOpacity
                  style={[styles.debugActionBtn, styles.debugReportBtn, { marginTop: 12 }]}
                  onPress={reportIssue}
                >
                  <Text style={styles.debugReportText}>🐛 报告问题到 Sentry</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

      </ScrollView>

      {toastMessage && (
        <BlurView intensity={80} tint="dark" style={[styles.toastContainer, { top: insets.top + 10 }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </BlurView>
      )}

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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  
  // Header
  dateHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#000000',
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIcon: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },

  // Cards Common
  cardContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },

  // Hero Card
  heroCard: {
    height: 420,
  },
  heroImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroGradient: {
    height: '50%',
    justifyContent: 'flex-end',
    padding: 20,
    borderRadius: 14,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  heroButton: {
    marginTop: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
    backdropFilter: 'blur(10px)',
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // List Card
  listCard: {
    padding: 20,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  listIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  listHeaderText: {
    flex: 1,
    marginLeft: 15,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  listActionBtn: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  listActionText: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 13,
  },
  listContent: {
    gap: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  listItemInfo: {
    flex: 1,
    marginRight: 10,
  },
  listItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  listItemValue: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  copyButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 13,
  },

  // Feature Card
  featureCard: {
    overflow: 'hidden',
  },
  featureImage: {
    height: 200,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 20,
  },
  featureTag: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featureTagText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  featureContent: {
    padding: 20,
    backgroundColor: '#F2F2F7',
  },
  featureSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  featureValue: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  featureButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  featureButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  featureButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Hidden
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

  // Debug Panel
  debugCard: {
    padding: 0,
    overflow: 'hidden',
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1C1C1E',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  debugToggle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  errorBox: {
    backgroundColor: '#FF3B30',
    padding: 12,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  debugContent: {
    padding: 16,
    backgroundColor: '#2C2C2E',
  },
  debugStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3A3A3C',
  },
  debugLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  debugValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  statusGranted: {
    color: '#30D158',
  },
  statusDenied: {
    color: '#FF3B30',
  },
  statusUndetermined: {
    color: '#FF9F0A',
  },
  debugSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  debugLogScroll: {
    maxHeight: 200,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
  },
  debugLogText: {
    fontSize: 11,
    color: '#98989F',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
    marginBottom: 4,
  },
  troubleshootBox: {
    marginTop: 12,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9F0A',
  },
  troubleshootTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF9F0A',
    marginBottom: 8,
  },
  troubleshootText: {
    fontSize: 13,
    color: '#E5E5EA',
    marginBottom: 6,
  },
  troubleshootItem: {
    fontSize: 12,
    color: '#98989F',
    lineHeight: 18,
    marginLeft: 8,
    marginBottom: 4,
  },
  debugButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  debugActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  debugCopyBtn: {
    backgroundColor: '#007AFF',
  },
  debugCopyText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  debugRefreshBtn: {
    backgroundColor: '#30D158',
  },
  debugRefreshText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  debugReportBtn: {
    backgroundColor: '#FF9F0A',
    width: '100%',
  },
  debugReportText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
