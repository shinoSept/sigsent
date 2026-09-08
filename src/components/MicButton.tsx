import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';
import { A11yPressable } from './A11yPressable';
import { Icon } from './Icon';
import { Text } from './Text';

type MicButtonProps = {
  recording: boolean;
  busy: boolean;
  onStart: () => void;
  onStop: () => void;
};

/**
 * ปุ่มไมค์ขนาดใหญ่กลางหน้าแชต
 *
 * ใช้กดค้างแล้วพูด ปล่อยเมื่อพูดจบ ซึ่งเป็นรูปแบบที่เด็กเข้าใจง่ายกว่าการกดเปิดกดปิด
 * ขนาด 120dp เพราะเป็นปุ่มที่ใช้บ่อยที่สุดของกลุ่มผู้ใช้ที่พิมพ์ไม่ได้
 */
export function MicButton({ recording, busy, onStart, onStop }: MicButtonProps) {
  const theme = useTheme();
  const t = useT();

  const label = recording ? t('chat.listening') : busy ? t('chat.transcribing') : t('chat.mic');

  return (
    <View style={styles.wrapper}>
      <A11yPressable
        accessibilityLabel={label}
        accessibilityHint={t('chat.micHint')}
        accessibilityState={{ selected: recording }}
        onPressIn={onStart}
        onPressOut={onStop}
        disabled={busy}
        haptic="heavy"
        minSize={theme.touch.hero}
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.accent,
            // วงแหวนรอบปุ่มขยายออกตอนกำลังอัด เป็นสัญญาณให้ผู้ที่ยังพอมองเห็น
            borderWidth: recording ? 8 : theme.isHighContrast ? 3 : 0,
            borderColor: recording ? theme.colors.focus : theme.colors.border,
          },
        ]}
      >
        <View style={styles.inner}>
          <Icon name="mic" size={52} color={theme.colors.onAccent} />
        </View>
      </A11yPressable>

      <Text
        variant="caption"
        color={theme.colors.textMuted}
        center
        accessibilityLiveRegion="polite"
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 8 },
  button: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: { alignItems: 'center', justifyContent: 'center' },
});
