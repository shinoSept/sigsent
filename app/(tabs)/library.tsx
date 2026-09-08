import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TextInput, View } from 'react-native';

import { A11yPressable } from '@/components/A11yPressable';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { TaleRow } from '@/components/TaleRow';
import { Text } from '@/components/Text';
import { useT } from '@/i18n';
import { useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';
import { fontForText } from '@/theme/fontForText';
import { useTheme } from '@/theme/useTheme';
import { announce } from '@/utils/announce';

export default function LibraryScreen() {
  const theme = useTheme();
  const t = useT();

  const tales = useLibrary((s) => s.tales);
  const loading = useLibrary((s) => s.loading);
  const error = useLibrary((s) => s.error);
  const refresh = useLibrary((s) => s.refresh);
  const removeTale = useLibrary((s) => s.removeTale);
  const pickRandom = useLibrary((s) => s.pickRandom);

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tales;
    return tales.filter((tale) => tale.title.toLowerCase().includes(q));
  }, [tales, query]);

  const confirmDelete = (taleId: string, title: string) => {
    Alert.alert(t('library.deleteConfirmTitle'), t('library.deleteConfirmBody', { title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void removeTale(taleId);
          announce(`${t('common.delete')} ${title} ${t('common.done')}`);
        },
      },
    ]);
  };

  const openRandom = () => {
    const tale = pickRandom();
    if (!tale) {
      announce(t('library.empty'));
      return;
    }
    // ประกาศชื่อเรื่องที่สุ่มได้ทันที เพราะเด็กที่มองไม่เห็นจะไม่รู้ว่าได้เรื่องอะไร
    announce(tale.title);
    router.push(`/tale/${tale.id}`);
  };

  const showEmpty = !loading && filtered.length === 0;

  return (
    <Screen
      title={t('library.title')}
      announcement={t('library.resultCount', { count: tales.length })}
      action={{
        icon: 'search',
        label: t('library.search'),
        onPress: () => {
          setSearchOpen((open) => !open);
          if (searchOpen) setQuery('');
        },
      }}
      scroll={false}
    >
      <View style={styles.body}>
        {searchOpen ? (
          <View style={{ paddingHorizontal: theme.space.lg, paddingTop: theme.space.lg }}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('library.searchPlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              accessibilityLabel={t('library.search')}
              autoFocus
              allowFontScaling={false}
              style={[
                styles.search,
                theme.type('body'),
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                  paddingHorizontal: theme.space.lg,
                  // เลือกฟอนต์จากตัวอักษรที่พิมพ์จริง ไม่ใช่จากภาษาที่ตั้งไว้
                  fontFamily: fontForText(query || t('library.searchPlaceholder')),
                },
              ]}
            />
          </View>
        ) : null}

        {error ? (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: theme.radius.md,
                margin: theme.space.lg,
                padding: theme.space.lg,
                gap: theme.space.sm,
              },
            ]}
          >
            <Text variant="body" color={theme.colors.danger}>
              {error}
            </Text>
            <A11yPressable
              accessibilityLabel={t('common.retry')}
              onPress={() => void refresh()}
              style={[
                styles.retry,
                { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md },
              ]}
            >
              <Text variant="label" bold color={theme.colors.onPrimary} center>
                {t('common.retry')}
              </Text>
            </A11yPressable>
          </View>
        ) : null}

        {loading && tales.length === 0 ? (
          <View style={styles.center} accessibilityLabel={t('common.loading')}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : showEmpty ? (
          <View style={[styles.center, { gap: theme.space.sm }]}>
            <Text variant="heading" bold center>
              {t('library.empty')}
            </Text>
            <Text variant="body" color={theme.colors.textMuted} center>
              {t('library.emptyHint')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(tale) => tale.id}
            contentContainerStyle={{
              padding: theme.space.lg,
              // เว้นที่ด้านล่างให้ปุ่มสุ่มลอยไม่บังรายการสุดท้าย
              paddingBottom: 140,
              gap: theme.space.md,
            }}
            renderItem={({ item }) => (
              <TaleRow
                tale={item}
                onPress={() => router.push(`/tale/${item.id}`)}
                onDelete={() => confirmDelete(item.id, item.title)}
              />
            )}
            refreshing={loading}
            onRefresh={() => void refresh()}
          />
        )}
      </View>

      <A11yPressable
        accessibilityLabel={t('library.random')}
        accessibilityHint={t('library.randomHint')}
        onPress={openRandom}
        disabled={tales.length === 0}
        haptic="medium"
        minSize={theme.touch.large}
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.accent,
            borderRadius: theme.radius.pill,
            borderWidth: theme.isHighContrast ? 3 : 0,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.fabInner}>
          <Icon name="dice" size={40} color={theme.colors.onAccent} />
        </View>
      </A11yPressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  search: { minHeight: 64, borderWidth: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorBox: { width: 'auto' },
  retry: { minHeight: 56, justifyContent: 'center', paddingHorizontal: 24 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabInner: { alignItems: 'center', justifyContent: 'center' },
});
