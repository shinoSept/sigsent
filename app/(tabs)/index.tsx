import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { BigCard } from '@/components/BigCard';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { minutesOf } from '@/components/TaleRow';
import { useT } from '@/i18n';
import { useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/useTheme';
import { announce } from '@/utils/announce';

export default function HomeScreen() {
  const theme = useTheme();
  const t = useT();
  const childName = useSettings((s) => s.childName);

  const tales = useLibrary((s) => s.tales);
  const progress = useLibrary((s) => s.progress);
  const lastTaleId = useLibrary((s) => s.lastTaleId);
  const refresh = useLibrary((s) => s.refresh);
  const pickRandom = useLibrary((s) => s.pickRandom);

  // ดึงคลังใหม่ทุกครั้งที่กลับมาหน้านี้ เพื่อให้เรื่องที่เพิ่งเพิ่มโผล่ทันที
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const continueTale = useMemo(
    () => tales.find((tale) => tale.id === lastTaleId),
    [tales, lastTaleId]
  );

  const remainingMinutes = useMemo(() => {
    if (!continueTale) return 0;
    const saved = progress[continueTale.id];
    if (!saved) return minutesOf(continueTale.durationMs);
    const perPage = continueTale.durationMs / Math.max(1, continueTale.totalPages);
    const consumed = saved.pageIndex * perPage + saved.positionMs;
    return minutesOf(Math.max(0, continueTale.durationMs - consumed));
  }, [continueTale, progress]);

  const openRandom = () => {
    const tale = pickRandom();
    if (!tale) {
      announce(t('home.emptyLibrary'));
      return;
    }
    // บอกชื่อเรื่องที่สุ่มได้ทันที เพราะเด็กที่มองไม่เห็นจะไม่รู้ว่าได้เรื่องอะไร
    announce(tale.title);
    router.push(`/tale/${tale.id}`);
  };

  const greeting = childName
    ? t('home.greeting', { name: childName })
    : t('home.greetingNoName');

  return (
    <Screen
      title={t('common.appName')}
      announcement={`${greeting}. ${t('home.subtitle')}`}
      action={{
        icon: 'bell',
        label: t('home.notifications'),
        onPress: () => announce(t('home.notifications')),
      }}
    >
      <View style={styles.greetingBlock}>
        <Text variant="display" bold accessibilityRole="header">
          {greeting}
        </Text>
        <Text variant="body" color={theme.colors.textMuted}>
          {t('home.subtitle')}
        </Text>
      </View>

      {continueTale ? (
        <BigCard
          icon="book"
          tone="primary"
          title={t('home.continue', { title: continueTale.title })}
          subtitle={t('home.continueMeta', {
            minutes: remainingMinutes,
            chapter: continueTale.chapter,
          })}
          accessibilityHint={t('home.continueHint')}
          onPress={() => router.push(`/tale/${continueTale.id}`)}
        />
      ) : null}

      <BigCard
        icon="dice"
        tone="secondary"
        title={t('home.random')}
        subtitle={t('home.randomMeta', { count: tales.length })}
        accessibilityHint={t('home.randomHint')}
        onPress={openRandom}
        disabled={tales.length === 0}
      />

      <BigCard
        icon="add"
        tone="tertiary"
        title={t('home.add')}
        subtitle={t('home.addMeta')}
        accessibilityHint={t('home.addHint')}
        onPress={() => router.push('/add')}
      />

      {tales.length === 0 ? (
        <Text variant="body" color={theme.colors.textMuted} center>
          {t('home.emptyLibrary')}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  greetingBlock: { gap: 4 },
});
