import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { A11yPressable } from '@/components/A11yPressable';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useT, type TFunction } from '@/i18n';
import { api } from '@/services/api';
import type { JobStatus } from '@/services/api/types';
import { useLibrary } from '@/store/library';
import { useTheme } from '@/theme/useTheme';
import { announce } from '@/utils/announce';

const POLL_MS = 700;

/** ข้อความสถานะที่จะบอกผู้ใช้ในแต่ละขั้น */
function statusLabel(t: TFunction, status: JobStatus): string {
  switch (status) {
    case 'reading':
      return t('processing.reading');
    case 'translating':
      return t('processing.translating');
    case 'narrating':
      return t('processing.narrating');
    case 'done':
      return t('processing.done');
    case 'failed':
      return t('processing.failed');
    default:
      return t('common.loading');
  }
}

/**
 * หน้ารอระหว่างเซิร์ฟเวอร์แปลงเนื้อหาเป็นนิทานพร้อมเสียง
 *
 * ผู้ใช้ที่มองไม่เห็นไม่มีทางรู้ว่าแอปกำลังทำงานอยู่หรือค้าง
 * จึงประกาศทุกครั้งที่สถานะเปลี่ยนขั้น และพาเข้าหน้าฟังให้เองเมื่อเสร็จ
 */
export default function ProcessingScreen() {
  const theme = useTheme();
  const t = useT();
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const refresh = useLibrary((s) => s.refresh);

  const [status, setStatus] = useState<JobStatus>('queued');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | undefined>();

  /** จำสถานะที่ประกาศไปแล้ว เพื่อไม่ให้พูดซ้ำทุกครั้งที่ poll */
  const announcedRef = useRef<JobStatus | null>(null);

  useEffect(() => {
    if (!jobId) {
      setError(t('processing.failed'));
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const job = await api.getJob(jobId);
        if (cancelled) return;

        setStatus(job.status);
        setProgress(job.progress);

        if (announcedRef.current !== job.status) {
          announcedRef.current = job.status;
          announce(statusLabel(t, job.status));
        }

        if (job.status === 'done' && job.taleId) {
          await refresh();
          if (cancelled) return;
          router.replace(`/tale/${job.taleId}`);
          return;
        }
        if (job.status === 'failed') {
          setError(job.error ?? t('processing.failed'));
          return;
        }

        timer = setTimeout(() => void poll(), POLL_MS);
      } catch {
        if (!cancelled) setError(t('processing.failed'));
      }
    };

    void poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId, refresh, t]);

  const percent = Math.round(progress * 100);

  return (
    <Screen title={t('processing.title')} scroll={false}>
      <View style={[styles.center, { padding: theme.space.xl, gap: theme.space.xl }]}>
        {error ? (
          <>
            <Text variant="heading" bold center color={theme.colors.danger}>
              {error}
            </Text>
            <A11yPressable
              accessibilityLabel={t('common.back')}
              onPress={() => router.replace('/add')}
              minSize={theme.touch.large}
              style={[
                styles.button,
                { backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg },
              ]}
            >
              <Text variant="heading" bold color={theme.colors.onPrimary} center>
                {t('common.retry')}
              </Text>
            </A11yPressable>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={theme.colors.accent} />

            <Text
              variant="heading"
              bold
              center
              accessibilityLiveRegion="polite"
              accessibilityLabel={`${statusLabel(t, status)}. ${t('processing.progress', { percent })}`}
            >
              {statusLabel(t, status)}
            </Text>

            {/* แถบความคืบหน้าเป็นภาพประกอบ ตัวเลขจริงอยู่ในข้อความด้านล่างที่ screen reader อ่านได้ */}
            <View
              style={[
                styles.track,
                { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.pill },
              ]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.max(4, percent)}%`,
                    backgroundColor: theme.colors.accent,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              />
            </View>

            <Text variant="body" color={theme.colors.textMuted} center>
              {t('processing.progress', { percent })}
            </Text>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  track: { width: '100%', height: 20, overflow: 'hidden' },
  fill: { height: '100%' },
  button: { minHeight: 88, justifyContent: 'center', paddingHorizontal: 32 },
});
