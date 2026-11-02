import { PermissionStatus } from 'expo-tracking-transparency';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image, Share, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Sentry from '@sentry/react-native';

import { useDeviceId } from '@/hooks/useDeviceId';

import { PatternHeader } from '@/components/PatternHeader';
import { HERO_PATTERNS, type HeroPattern } from '@/assets/images/patterns';
import { useI18n } from '@/lib/i18n';

// Hero Patterns pool (25 SVGs): Hero Patterns CC BY 4.0 + pattern.monster MIT — see Credits
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  
  // Sentry: 页面加载追踪
  useEffect(() => {
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: 'Opened home',
      level: 'info',
    });
  }, []);
  
  // Sentry: 应用状态追踪
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      Sentry.addBreadcrumb({
        category: 'app_state',
        message: `App state changed: ${nextAppState}`,
        data: { state: nextAppState },
        level: 'info',
      });
    });

    return () => {
      subscription.remove();
    };
  }, []);
  
  // Bundled local images (no third-party image requests)
  const APP_ICON_IMG = require('@/assets/images/icon.png');

  // Independent random pattern per header image area (re-roll on remount / cold open)
  // Mount-time random pick (client-only) so SSR/web hydration stays stable
  const pickPattern = () => HERO_PATTERNS[Math.floor(Math.random() * HERO_PATTERNS.length)];
  const [heroPattern, setHeroPattern] = useState<HeroPattern>(HERO_PATTERNS[0]);
  const [uaPattern, setUaPattern] = useState<HeroPattern>(HERO_PATTERNS[1 % HERO_PATTERNS.length]);
  const [ipPattern, setIpPattern] = useState<HeroPattern>(HERO_PATTERNS[2 % HERO_PATTERNS.length]);
  useEffect(() => {
    setHeroPattern(pickPattern());
    setUaPattern(pickPattern());
    setIpPattern(pickPattern());
  }, []);
  
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
  const [debugUnlocked, setDebugUnlocked] = useState(false);
  const [titleTapCount, setTitleTapCount] = useState(0);
  const lastTitleTapAt = useRef(0);

  const handleTitleTap = () => {
    const now = Date.now();
    const gap = now - lastTitleTapAt.current;
    lastTitleTapAt.current = now;
    setTitleTapCount((prev) => {
      const next = gap < 1000 ? prev + 1 : 1;
      if (next >= 5) {
        setDebugUnlocked(true);
        setShowDebugPanel(true);
        return 0;
      }
      return next;
    });
  };

  const hideDebugPanelCompletely = () => {
    setDebugUnlocked(false);
    setShowDebugPanel(false);
    setTitleTapCount(0);
    lastTitleTapAt.current = 0;
  };
  
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
    showToast(t('home.copied'));
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
        Alert.alert(t('home.ipFailedTitle'), t('home.ipFailedParse'));
      }
    } catch (error) {
      Alert.alert(t('home.ipFailedTitle'), t('home.ipFailedFetch'));
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
        message: 'User tapped share',
        level: 'info',
      });
      
      const deviceInfo = {
        'Application ID': applicationId,
        'App Version': nativeVersion,
        'Build Version': nativeBuildVersion,
        [Platform.OS === 'ios' ? 'IDFA' : 'GAID']: advertisingId || 'N/A',
        [Platform.OS === 'ios' ? 'IDFV' : 'Android ID']: Platform.OS === 'ios' ? idfv : androidId,
        'UserAgent': userAgent || 'N/A',
        'IP Address': ipAddress || 'N/A',
      };

      const message = Object.entries(deviceInfo)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

      await Share.share({
        message: `${t('home.shareTitle')}\n\n${message}`,
        title: t('home.shareTitle')
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
      message: 'User tapped report issue',
      level: 'info',
    });
    
    const eventId = Sentry.captureMessage('User reported IDFA issue', {
      level: 'info',
      tags: {
        feature: 'idfa',
        user_reported: true,
        platform: Platform.OS,
      },
      contexts: {
        debug_info: {
          logs: debugInfo.slice(-20).map(l => l.replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '[redacted-id]')), // 最后20条日志
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
    
    showToast(t('home.issueReported', { id: eventId?.substring(0, 8) || '' }));
  };

  // --- Components ---

  const DateHeader = () => {
    return (
      <View style={styles.dateHeader}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            onPress={handleTitleTap}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('home.title')}
            style={styles.titleTapTarget}
          >
            <Text style={styles.dateTitle}>{t('home.title')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareIcon}>↗</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const HeroCard = ({ pattern }: { pattern: HeroPattern }) => {
    const id = Platform.OS === 'ios' ? advertisingId : advertisingId;
    const title = Platform.OS === 'ios' ? "IDFA" : "GAID";
    const hasPermission = permissionStatus === PermissionStatus.GRANTED;

    return (
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => id && copyToClipboard(id)}
        style={[styles.cardContainer, styles.heroCard, styles.heroCardSplit]}
      >
        <PatternHeader xml={pattern.xml} height={220} style={styles.heroImageTop}>
          <View style={styles.heroImageTag}>
            <Text style={styles.heroImageTagText}>{title}</Text>
          </View>
        </PatternHeader>
        <View style={styles.heroInfoPanel}>
          <Text style={styles.heroSubtitleDark}>{t('home.deviceIdentifier')}</Text>
          <Text style={styles.heroTitleDark}>{title}</Text>
          <Text style={styles.heroDescriptionDark} numberOfLines={2}>
            {hasPermission ? (id || t('home.loading')) : t('home.permissionRequired')}
          </Text>
          {!hasPermission && (
            <TouchableOpacity 
              style={styles.heroButtonDark}
              onPress={(e: any) => {
                e.stopPropagation();
                requestPermission();
              }}
            >
              <Text style={styles.heroButtonTextDark}>{t('home.allowAccess')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const AppInfoCard = () => {
    const items = [
      { label: t('home.bundleId'), value: applicationId },
      { label: t('home.version'), value: nativeVersion },
      { label: t('home.build'), value: nativeBuildVersion },
      { label: Platform.OS === 'ios' ? 'IDFV' : 'Android ID', value: Platform.OS === 'ios' ? idfv : androidId },
    ];

    return (
      <View style={[styles.cardContainer, styles.listCard]}>
        <View style={styles.listHeader}>
          <Image source={APP_ICON_IMG} style={styles.listIcon} />
          <View style={styles.listHeaderText}>
            <Text style={styles.listTitle}>{t('home.appInfo')}</Text>
            <Text style={styles.listSubtitle}>{t('home.appInfoSubtitle')}</Text>
          </View>
          <TouchableOpacity style={styles.listActionBtn} onPress={() => copyToClipboard(JSON.stringify(items))}>
             <Text style={styles.listActionText}>{t('home.copyAll')}</Text>
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
                <Text style={styles.copyButtonText}>{t('home.copy')}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const FeatureCard = ({ title, subtitle, value, action, actionLabel, isLoading, pattern }: any) => (
    <View style={[styles.cardContainer, styles.featureCard]}>
      <PatternHeader xml={pattern.xml} height={200} style={styles.featureImage}>
        <View style={styles.featureTag}>
          <Text style={styles.featureTagText}>{t('home.network')}</Text>
        </View>
      </PatternHeader>
      <View style={styles.featureContent}>
        <Text style={styles.featureSubtitle}>{subtitle}</Text>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureValue} numberOfLines={2}>
          {value || t('home.tapToLoad')}
        </Text>
        
        <View style={styles.featureButtonContainer}>
          {!value ? (
            <TouchableOpacity style={styles.featureButton} onPress={action}>
              <Text style={styles.featureButtonText}>{isLoading ? t('home.loading') : actionLabel}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.featureButton} onPress={() => copyToClipboard(value)}>
              <Text style={styles.featureButtonText}>{t('home.copy')}</Text>
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
        
        <HeroCard pattern={heroPattern} />
        
        <AppInfoCard />
        
        <FeatureCard 
          title={t('home.userAgent')}
          subtitle={t('home.userAgentSubtitle')}
          value={userAgent}
          action={getUserAgent}
          actionLabel={t('home.getUa')}
          pattern={uaPattern}
        />

        <FeatureCard
          title={t('home.ipAddress')}
          subtitle={t('home.ipSubtitle')}
          value={ipAddress ? `${ipAddress}${ipLocation ? ` (${ipLocation})` : ''}` : null}
          action={getIpAddress}
          actionLabel={t('home.getIp')}
          isLoading={isLoadingIp}
          pattern={ipPattern}
        />

        {/* Debug panel — hidden until unlocked via 5 quick taps on the home title */}
        {debugUnlocked && (
        <View style={[styles.cardContainer, styles.debugCard]}>
          <TouchableOpacity 
            style={styles.debugHeader} 
            onPress={() => setShowDebugPanel(!showDebugPanel)}
          >
            <Text style={styles.debugTitle}>🔧 {t('debug.title')}</Text>
            <Text style={styles.debugToggle}>{showDebugPanel ? t('debug.hide') : t('debug.show')}</Text>
          </TouchableOpacity>
          
          {lastError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>❌ {t('debug.errorPrefix')} {lastError}</Text>
            </View>
          )}
          
          {showDebugPanel && (
            <View style={styles.debugContent}>
              <View style={styles.debugStatusRow}>
                <Text style={styles.debugLabel}>{t('debug.permission')}</Text>
                <Text style={[
                  styles.debugValue,
                  permissionStatus === PermissionStatus.GRANTED ? styles.statusGranted :
                  permissionStatus === PermissionStatus.DENIED ? styles.statusDenied :
                  styles.statusUndetermined
                ]}>
                  {permissionStatus === PermissionStatus.GRANTED ? `✅ ${t('debug.allowed')}` :
                   permissionStatus === PermissionStatus.DENIED ? `❌ ${t('debug.statusDenied')}` :
                   permissionStatus === PermissionStatus.UNDETERMINED ? `⏳ ${t('debug.notDetermined')}` :
                   t('debug.statusUnknown', { status: String(permissionStatus) })}
                </Text>
              </View>
              
              <View style={styles.debugStatusRow}>
                <Text style={styles.debugLabel}>IDFA:</Text>
                <Text style={styles.debugValue} numberOfLines={1}>
                  {advertisingId || 'N/A'}
                </Text>
              </View>
              
              {Platform.OS === 'ios' && (
                <View style={styles.debugStatusRow}>
                  <Text style={styles.debugLabel}>IDFV:</Text>
                  <Text style={styles.debugValue} numberOfLines={1}>
                    {idfv || 'N/A'}
                  </Text>
                </View>
              )}
              
              {/* 故障排除指南 */}
              {!advertisingId && permissionStatus === PermissionStatus.GRANTED && (
                <View style={styles.troubleshootBox}>
                  <Text style={styles.troubleshootTitle}>🔍 {t('debug.troubleTitle')}</Text>
                  <Text style={styles.troubleshootText}>{t('debug.troubleIntro')}</Text>
                  <Text style={styles.troubleshootItem}>{t('debug.trouble1')}</Text>
                  <Text style={styles.troubleshootItem}>{t('debug.trouble2')}</Text>
                  <Text style={styles.troubleshootItem}>{t('debug.trouble3')}</Text>
                  <Text style={styles.troubleshootItem}>{t('debug.trouble4')}</Text>
                </View>
              )}
              
              {permissionStatus === PermissionStatus.DENIED && (
                <View style={styles.troubleshootBox}>
                  <Text style={styles.troubleshootTitle}>💡 {t('debug.enableTitle')}</Text>
                  <Text style={styles.troubleshootItem}>{t('debug.enable1')}</Text>
                  <Text style={styles.troubleshootItem}>{t('debug.enable2')}</Text>
                  <Text style={styles.troubleshootItem}>{t('debug.enable3')}</Text>
                  <Text style={styles.troubleshootItem}>{t('debug.enable4')}</Text>
                  <Text style={styles.troubleshootItem}>{t('debug.enable5')}</Text>
                </View>
              )}
              
              {permissionStatus === PermissionStatus.UNDETERMINED && (
                <View style={styles.troubleshootBox}>
                  <Text style={styles.troubleshootTitle}>📌 {t('debug.tipTitle')}</Text>
                  <Text style={styles.troubleshootText}>{t('debug.tipText')}</Text>
                </View>
              )}
              
              <Text style={styles.debugSectionTitle}>📋 {t('debug.logs')}</Text>
              <ScrollView style={styles.debugLogScroll} nestedScrollEnabled>
                {debugInfo.map((info, index) => (
                  <Text key={index} style={styles.debugLogText}>{info}</Text>
                ))}
                {debugInfo.length === 0 && (
                  <Text style={styles.debugLogText}>{t('debug.noLogs')}</Text>
                )}
              </ScrollView>
              
              <View style={styles.debugButtonsRow}>
                <TouchableOpacity
                  style={[styles.debugActionBtn, styles.debugCopyBtn]}
                  onPress={() => copyToClipboard(debugInfo.join('\n'))}
                >
                  <Text style={styles.debugCopyText}>📋 {t('debug.copyLogs')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.debugActionBtn, styles.debugRefreshBtn]}
                  onPress={() => {
                    Sentry.addBreadcrumb({
                      category: 'user_action',
                      message: 'User tapped retry',
                      level: 'info',
                    });
                    requestPermission();
                  }}
                >
                  <Text style={styles.debugRefreshText}>🔄 {t('debug.retry')}</Text>
                </TouchableOpacity>
              </View>
              
              {/* 报告问题按钮 */}
              {(lastError || (!advertisingId && permissionStatus === PermissionStatus.GRANTED)) && (
                <TouchableOpacity
                  style={[styles.debugActionBtn, styles.debugReportBtn, { marginTop: 12 }]}
                  onPress={reportIssue}
                >
                  <Text style={styles.debugReportText}>🐛 {t('debug.reportIssue')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.hidePanelBtn}
            onPress={hideDebugPanelCompletely}
            accessibilityRole="button"
          >
            <Text style={styles.hidePanelText}>{t('debug.hidePanel')}</Text>
          </TouchableOpacity>
        </View>
        )}

        {/* About link → About → Credits (attribution moved off home) */}
        <TouchableOpacity
          onPress={() => router.push('/about')}
          style={styles.aboutLinkWrap}
          accessibilityRole="link"
        >
          <Text style={styles.aboutLink}>{t('home.about')}</Text>
        </TouchableOpacity>

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
  titleTapTarget: {
    flexShrink: 1,
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

  // Hero Card — image on top, white info panel below (no blue under IDFA)
  heroCard: {
    overflow: 'hidden',
  },
  heroCardSplit: {
    height: undefined,
  },
  heroImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroImageTop: {
    // height applied via PatternHeader; padding insets the tag only
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 16,
    width: '100%',
  },
  heroImageTag: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  heroImageTagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroInfoPanel: {
    backgroundColor: '#FFFFFF',
    padding: 20,
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
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  heroSubtitleDark: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  heroTitleDark: {
    color: '#000000',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroDescriptionDark: {
    color: '#3A3A3C',
    fontSize: 15,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  heroButtonDark: {
    marginTop: 14,
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  heroButtonTextDark: {
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
    // height applied via PatternHeader
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 20,
    width: '100%',
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

  aboutLinkWrap: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 10,
  },
  aboutLink: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  hidePanelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#1C1C1E',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#3A3A3C',
  },
  hidePanelText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
});
