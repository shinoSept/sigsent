import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { Screen } from '@/components/Screen';
import { TaleRow } from '@/components/TaleRow';
import { Text } from '@/components/Text';
import { useT } from '@/i18n';
import { useLibrary } from '@/store/library';
import { useTheme } from '@/theme/useTheme';

/**
 * แท็บพูดคุย
 *
 * การแชตผูกกับนิทานหนึ่งเรื่องเสมอ เพราะคำตอบต้องอ้างอิงเนื้อเรื่องที่เด็กกำลังฟัง
 * หน้านี้จึงทำหน้าที่ให้เลือกเรื่องก่อน แล้วค่อยเข้าห้องสนทนาของเรื่องนั้น
 */
export default function ChatTabScreen() {
  const theme = useTheme();
  const t = useT();

  const tales = useLibrary((s) => s.tales);
  const lastTaleId = useLibrary((s) => s.lastTaleId);
  const refresh = useLibrary((s) => s.refresh);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  // เรียงเรื่องที่ฟังล่าสุดไว้บนสุด เพราะมีโอกาสสูงสุดที่เด็กอยากถามเรื่องนั้น
  const ordered = lastTaleId
    ? [...tales].sort((a, b) => (a.id === lastTaleId ? -1 : b.id === lastTaleId ? 1 : 0))
    : tales;

  return (
    <Screen
      title={t('chat.title')}
      announcement={
        tales.length > 0 ? t('chat.pickTaleHint') : t('library.emptyHint')
      }
    >
      <Text variant="heading" bold accessibilityRole="header">
        {t('chat.pickTale')}
      </Text>

      {ordered.length === 0 ? (
        <Text variant="body" color={theme.colors.textMuted}>
          {t('library.emptyHint')}
        </Text>
      ) : (
        ordered.map((tale) => (
          <TaleRow
            key={tale.id}
            tale={tale}
            onPress={() => router.push(`/tale/${tale.id}/chat`)}
          />
        ))
      )}
    </Screen>
  );
}
