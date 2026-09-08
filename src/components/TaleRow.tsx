import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import type { Tale } from '@/services/api/types';
import { useTheme } from '@/theme/useTheme';
import { A11yPressable } from './A11yPressable';
import { Icon } from './Icon';
import { Text } from './Text';

type TaleRowProps = {
  tale: Tale;
  onPress: () => void;
  onDelete?: () => void;
};

/** จำนวนนาทีแบบปัดขึ้น อย่างน้อยหนึ่งนาที เพื่อไม่ให้ขึ้นว่า 0 นาที */
export function minutesOf(durationMs: number): number {
  return Math.max(1, Math.round(durationMs / 60000));
}

/**
 * รายการนิทานหนึ่งแถวในคลัง
 *
 * ทั้งแถวเป็นปุ่มเดียว ไม่แยกเป็นหลายจุดโฟกัส เพื่อให้กวาดนิ้วหาเรื่องที่ต้องการได้เร็ว
 * ปุ่มลบแยกเป็นอีกจุดโฟกัสหนึ่งและมี label ของตัวเอง
 */
export function TaleRow({ tale, onPress, onDelete }: TaleRowProps) {
  const theme = useTheme();
  const t = useT();

  const meta = `${t('common.minutes', { count: minutesOf(tale.durationMs) })} · ${t('common.chapter', { number: tale.chapter })}`;

  return (
    <View style={[styles.wrapper, { gap: theme.space.sm }]}>
      <A11yPressable
        accessibilityLabel={`${tale.title}. ${meta}`}
        accessibilityHint={t('library.itemHint')}
        onPress={onPress}
        minSize={80}
        style={[
          styles.row,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            padding: theme.space.md,
            gap: theme.space.md,
            borderWidth: theme.isHighContrast ? 2 : StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.inner}>
          <View
            style={[
              styles.cover,
              { backgroundColor: tale.coverColor, borderRadius: theme.radius.md },
            ]}
          >
            <Icon name="book" size={28} color="#FFFFFF" />
          </View>

          <View style={styles.text}>
            <Text variant="heading" bold numberOfLines={2}>
              {tale.title}
            </Text>
            <Text variant="caption" color={theme.colors.textMuted}>
              {meta}
            </Text>
          </View>

          <Icon name="forward" size={26} color={theme.colors.textMuted} />
        </View>
      </A11yPressable>

      {onDelete ? (
        <A11yPressable
          accessibilityLabel={`${t('common.delete')} ${tale.title}`}
          accessibilityHint={t('library.deleteConfirmBody', { title: tale.title })}
          onPress={onDelete}
          haptic="warning"
          minSize={64}
          style={[
            styles.delete,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: theme.radius.md,
              borderWidth: theme.isHighContrast ? 2 : 0,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon name="trash" size={24} color={theme.colors.danger} />
        </A11yPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'stretch' },
  row: { flex: 1 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cover: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  delete: { width: 64, alignItems: 'center', justifyContent: 'center' },
});
