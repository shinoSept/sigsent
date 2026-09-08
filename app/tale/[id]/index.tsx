import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { A11yPressable } from '@/components/A11yPressable';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Waveform } from '@/components/Waveform';
import { useNarrator } from '@/audio/useNarrator';
import type { NarratorPage } from '@/audio/types';
import { useT } from '@/i18n';
import { api } from '@/services/api';
import type { TaleDetail } from '@/services/api/types';
import { useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/useTheme';
import { announce } from '@/utils/announce';

const SKIP_MS = 10_000;

export default function ReaderScreen() {
  const theme = useTheme();
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();

  const readingLang = useSettings((s) => s.readingLang);
  const speechRate = useSettings((s) => s.speechRate);
  const voiceId = useSettings((s) => s.voiceId);
  const saveProgress = useLibrary((s) => s.saveProgress);
  const savedProgress = useLibrary((s) => (id ? s.progress[id] : undefined));

  const [tale, setTale] = useState<TaleDetail | null>(null);
  const [pages, setPages] = useState<NarratorPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [menuOpen, setMenuOpen] = useState(false);

  // โหลดเนื้อเรื่องและข้อมูลเสียงพร้อมกัน ทั้งสองอย่างจำเป็นก่อนเริ่มเล่นได้
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(undefined);
      try {
        const detail = await api.getTale(id);
        const narration = await api.getNarration(id, { lang: readingLang, voiceId });
        if (cancelled) return;

        setTale(detail);
        setPages(
          detail.pages.map((page) => {
            const audio = narration.pages.find((p) => p.pageIndex === page.index);
            return {
              index: page.index,
              text: page.translations?.[readingLang] ?? page.text,
              audioUrl: audio?.audioUrl ?? '',
              durationMs: audio?.durationMs ?? 8000,
              marks: audio?.marks,
            };
          })
        );
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : t('common.error'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, readingLang, voiceId, t]);

  const onPageChange = useCallback(
    (index: number) => {
      // บอกหน้าใหม่ทุกครั้ง เพราะเป็นสัญญาณเดียวที่ผู้ใช้ที่มองไม่เห็นจะรู้ว่าเปลี่ยนหน้าแล้ว
      announce(t('reader.pageOf', { current: index + 1, total: pages.length }));
    },
    [t, pages.length]
  );

  const onFinished = useCallback(() => {
    announce(t('reader.finished'));
  }, [t]);

  const narrator = useNarrator(pages, {
    rate: speechRate,
    lang: readingLang,
    onPageChange,
    onFinished,
  });

  // กลับมาที่หน้าที่ค้างไว้ครั้งก่อน ทำครั้งเดียวหลังโหลดเสร็จ
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    if (restored || loading || pages.length === 0) return;
    setRestored(true);
    if (savedProgress && savedProgress.pageIndex > 0) {
      narrator.goToPage(savedProgress.pageIndex);
    }
  }, [restored, loading, pages.length, savedProgress, narrator]);

  // บันทึกความคืบหน้าไว้ให้ปุ่ม "อ่านต่อ" บนหน้าแรกใช้
  useEffect(() => {
    if (!id || loading) return;
    saveProgress(id, narrator.pageIndex, narrator.positionMs);
  }, [id, loading, narrator.pageIndex, narrator.positionMs, saveProgress]);

  const currentPage = pages[narrator.pageIndex];
  const progressRatio =
    narrator.durationMs > 0 ? narrator.positionMs / narrator.durationMs : 0;

  /** ข้อความของหน้านี้ แบ่งเป็นส่วนที่อ่านไปแล้วกับยังไม่ได้อ่าน เพื่อไฮไลต์ตามเสียง */
  const highlight = useMemo(() => {
    if (!currentPage) return { read: '', rest: '' };
    const cut = Math.max(0, Math.min(currentPage.text.length, narrator.charIndex));
    return {
      read: currentPage.text.slice(0, cut),
      rest: currentPage.text.slice(cut),
    };
  }, [currentPage, narrator.charIndex]);

  if (loading) {
    return (
      <Screen title={t('reader.title')} showBack scroll={false}>
        <View style={styles.center} accessibilityLabel={t('reader.loadingAudio')}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (loadError || !tale) {
    return (
      <Screen title={t('reader.title')} showBack>
        <Text variant="heading" bold color={theme.colors.danger} center>
          {loadError ?? t('common.error')}
        </Text>
      </Screen>
    );
  }

  const playLabel = narrator.isPlaying ? t('reader.pause') : t('reader.play');

  return (
    <Screen
      title={t('common.chapter', { number: tale.chapter })}
      showBack
      scroll={false}
      announcement={`${tale.title}. ${t('reader.pageOf', { current: narrator.pageIndex + 1, total: pages.length })}`}
      action={{
        icon: 'more',
        label: t('reader.menu'),
        onPress: () => setMenuOpen((open) => !open),
      }}
    >
      <ScrollView
        contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.lg, paddingBottom: 40 }}
      >
        {/* ภาพปก — เป็นของประกอบ แต่ป้ายบอกว่าสร้างด้วย AI ต้องอ่านออกเสียงได้ */}
        <View
          style={[
            styles.cover,
            { backgroundColor: tale.coverColor, borderRadius: theme.radius.lg },
          ]}
        >
          <Icon name="book" size={72} color="#FFFFFF" />
          {tale.coverIsAI ? (
            <View
              style={[
                styles.aiBadge,
                { backgroundColor: theme.colors.surface, borderRadius: theme.radius.sm },
              ]}
            >
              <Text variant="caption" accessibilityLabel={t('reader.aiImage')}>
                {t('reader.aiImage')}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ gap: 4 }}>
          <Text variant="title" bold center accessibilityRole="header">
            {tale.title}
          </Text>
          <Text variant="caption" color={theme.colors.textMuted} center>
            {`${t('reader.readBy', { voice: t(`voices.${voiceId}` as 'voices.warm') })} · ${t('reader.speed', { rate: speechRate })}`}
          </Text>
        </View>

        {menuOpen ? <ReaderMenu onClose={() => setMenuOpen(false)} /> : null}

        <Waveform progress={progressRatio} />

        {/* ปุ่มควบคุมหลัก เรียงตามลำดับที่ screen reader จะกวาดเจอ: ถอย เล่น เดินหน้า */}
        <View style={[styles.controls, { gap: theme.space.lg }]}>
          <A11yPressable
            accessibilityLabel={t('reader.back10')}
            onPress={() => narrator.skip(-SKIP_MS)}
            style={[styles.roundButton, { backgroundColor: theme.colors.surfaceAlt }]}
          >
            <Icon name="back10" size={34} color={theme.colors.text} />
          </A11yPressable>

          <A11yPressable
            accessibilityLabel={playLabel}
            accessibilityRole="button"
            accessibilityState={{ selected: narrator.isPlaying }}
            accessibilityValue={{
              text: t('reader.pageOf', {
                current: narrator.pageIndex + 1,
                total: pages.length,
              }),
            }}
            onPress={() => {
              narrator.toggle();
              announce(narrator.isPlaying ? t('reader.paused') : t('reader.playing'));
            }}
            haptic="medium"
            minSize={theme.touch.large}
            style={[
              styles.playButton,
              {
                backgroundColor: theme.colors.accent,
                borderWidth: theme.isHighContrast ? 3 : 0,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.playInner}>
              <Icon
                name={narrator.isPlaying ? 'pause' : 'play'}
                size={48}
                color={theme.colors.onAccent}
              />
            </View>
          </A11yPressable>

          <A11yPressable
            accessibilityLabel={t('reader.forward10')}
            onPress={() => narrator.skip(SKIP_MS)}
            style={[styles.roundButton, { backgroundColor: theme.colors.surfaceAlt }]}
          >
            <Icon name="forward10" size={34} color={theme.colors.text} />
          </A11yPressable>
        </View>

        <Text
          variant="caption"
          color={theme.colors.textMuted}
          center
          accessibilityLiveRegion="polite"
        >
          {t('reader.pageOf', { current: narrator.pageIndex + 1, total: pages.length })}
        </Text>

        {/* เนื้อเรื่องของหน้าปัจจุบัน ส่วนที่อ่านไปแล้วเน้นสีให้เด็กสายตาเลือนรางตามได้ */}
        {currentPage ? (
          <View
            style={[
              styles.textCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.lg,
                padding: theme.space.lg,
                borderWidth: theme.isHighContrast ? 2 : 0,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text variant="body" accessibilityLabel={currentPage.text}>
              <Text variant="body" bold color={theme.colors.accent}>
                {highlight.read}
              </Text>
              <Text variant="body" color={theme.colors.textMuted}>
                {highlight.rest}
              </Text>
            </Text>
          </View>
        ) : null}

        <A11yPressable
          accessibilityLabel={t('reader.askAbout')}
          accessibilityHint={t('reader.askHint')}
          onPress={() => {
            narrator.pause();
            router.push(`/tale/${tale.id}/chat`);
          }}
          minSize={theme.touch.large}
          style={[
            styles.askBar,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.lg,
              padding: theme.space.lg,
            },
          ]}
        >
          <View style={[styles.askInner, { gap: theme.space.md }]}>
            <Icon name="mic" size={32} color={theme.colors.onPrimary} />
            <Text variant="label" bold color={theme.colors.onPrimary} style={{ flex: 1 }}>
              {t('reader.askAbout')}
            </Text>
          </View>
        </A11yPressable>
      </ScrollView>
    </Screen>
  );
}

/** เมนูตัวเลือกจากปุ่มสามจุด: ความเร็ว ภาษาที่อ่าน และเสียงผู้เล่า */
function ReaderMenu({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const t = useT();
  const speechRate = useSettings((s) => s.speechRate);
  const setSpeechRate = useSettings((s) => s.setSpeechRate);

  const rates = [0.75, 1, 1.25, 1.5, 2];

  return (
    <View
      style={[
        styles.menu,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderRadius: theme.radius.lg,
          padding: theme.space.lg,
          gap: theme.space.md,
          borderWidth: theme.isHighContrast ? 2 : 0,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text variant="label" bold>
        {t('settings.speechRate')}
      </Text>
      <View style={[styles.chipRow, { gap: theme.space.sm }]}>
        {rates.map((rate) => {
          const selected = Math.abs(rate - speechRate) < 0.01;
          return (
            <A11yPressable
              key={rate}
              accessibilityLabel={t('reader.speed', { rate })}
              accessibilityState={{ selected }}
              onPress={() => {
                setSpeechRate(rate);
                onClose();
              }}
              minSize={64}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                  borderRadius: theme.radius.pill,
                  borderWidth: 2,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text
                variant="label"
                bold
                center
                color={selected ? theme.colors.onPrimary : theme.colors.text}
              >
                {`${rate}x`}
              </Text>
            </A11yPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cover: {
    width: '100%',
    aspectRatio: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadge: { position: 'absolute', left: 12, bottom: 12, paddingHorizontal: 10, paddingVertical: 6 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  roundButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playInner: { alignItems: 'center', justifyContent: 'center' },
  textCard: { width: '100%' },
  askBar: { width: '100%' },
  askInner: { flexDirection: 'row', alignItems: 'center' },
  menu: { width: '100%' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { minWidth: 72, paddingHorizontal: 16, justifyContent: 'center' },
});
