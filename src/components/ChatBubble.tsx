import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import type { ChatMessage } from '@/services/api/types';
import { useTheme } from '@/theme/useTheme';
import { A11yPressable } from './A11yPressable';
import { Icon } from './Icon';
import { Text } from './Text';

type ChatBubbleProps = {
  message: ChatMessage;
  onReplay?: () => void;
};

/**
 * บับเบิลข้อความหนึ่งอัน
 *
 * ใส่คำนำหน้าใน accessibilityLabel ว่าใครพูด เพราะเด็กที่มองไม่เห็นแยกฝั่งซ้ายขวาไม่ได้
 * คำตอบของ AI มีปุ่มฟังซ้ำของตัวเอง เพราะเด็กมักอยากให้อ่านใหม่อีกรอบ
 */
export function ChatBubble({ message, onReplay }: ChatBubbleProps) {
  const theme = useTheme();
  const t = useT();

  const isChild = message.role === 'child';
  const bg = isChild ? theme.colors.bubbleUser : theme.colors.bubbleBot;
  const fg = isChild ? theme.colors.onBubbleUser : theme.colors.onBubbleBot;
  const speaker = isChild ? t('chat.fromChild') : t('chat.fromBot');

  return (
    <View
      style={[
        styles.row,
        { justifyContent: isChild ? 'flex-end' : 'flex-start', gap: theme.space.sm },
      ]}
    >
      <View
        accessible
        accessibilityLabel={`${speaker} ${message.text}`}
        style={[
          styles.bubble,
          {
            backgroundColor: bg,
            borderRadius: theme.radius.lg,
            padding: theme.space.lg,
            borderWidth: theme.isHighContrast ? 2 : 0,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text variant="body" color={fg}>
          {message.text}
        </Text>
      </View>

      {!isChild && onReplay ? (
        <A11yPressable
          accessibilityLabel={t('chat.replay')}
          onPress={onReplay}
          minSize={56}
          style={[
            styles.replay,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: theme.radius.pill,
              borderWidth: theme.isHighContrast ? 2 : 0,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon name="volume" size={24} color={theme.colors.text} />
        </A11yPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', width: '100%' },
  bubble: { maxWidth: '82%' },
  replay: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
});
