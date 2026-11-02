import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/lib/i18n';

export default function CreditsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{`‹ ${t('credits.back')}`}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('credits.title')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Attribution body intentionally English in all locales */}
        <Text style={styles.para}>{t('credits.hero')}</Text>
        <Text style={styles.para}>{t('credits.monster')}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  back: { color: '#007AFF', fontSize: 17, fontWeight: '500', marginBottom: 12 },
  title: { fontSize: 34, fontWeight: '800', color: '#000' },
  body: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  para: { fontSize: 15, lineHeight: 22, color: '#6C6C70', marginBottom: 12 },
});
