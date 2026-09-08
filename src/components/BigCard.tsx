import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { A11yPressable } from './A11yPressable';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type BigCardTone = 'primary' | 'secondary' | 'tertiary';

type BigCardProps = {
  title: string;
  subtitle?: string;
  icon: IconName;
  tone?: BigCardTone;
  /** สิ่งที่ screen reader จะอ่าน ถ้าไม่ใส่จะใช้ title ต่อด้วย subtitle */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  onPress: () => void;
  disabled?: boolean;
};

/**
 * การ์ดใหญ่บนหน้าแรก (อ่านต่อ / สุ่มนิทาน / เพิ่มนิทาน)
 *
 * สูงอย่างน้อย 96dp และไอคอนขนาด 36 ขึ้นไป เพื่อให้เด็กสายตาเลือนรางเห็นรูปทรงได้
 * แม้จะแยกตัวอักษรไม่ออก
 */
export function BigCard({
  title,
  subtitle,
  icon,
  tone = 'primary',
  accessibilityLabel,
  accessibilityHint,
  onPress,
  disabled,
}: BigCardProps) {
  const theme = useTheme();

  const bg =
    tone === 'primary'
      ? theme.colors.primary
      : tone === 'secondary'
        ? theme.colors.secondary
        : theme.colors.tertiary;
  const fg =
    tone === 'primary'
      ? theme.colors.onPrimary
      : tone === 'secondary'
        ? theme.colors.onSecondary
        : theme.colors.onTertiary;

  return (
    <A11yPressable
      accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}. ${subtitle}` : title)}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      disabled={disabled}
      minSize={96}
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderRadius: theme.radius.lg,
          padding: theme.space.lg,
          // ในธีมคอนทราสต์สูง พื้นการ์ดกับพื้นหลังใกล้กัน ต้องมีขอบช่วยแยก
          borderWidth: theme.isHighContrast ? 2 : 0,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={[styles.row, { gap: theme.space.lg }]}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: theme.isHighContrast ? 'transparent' : 'rgba(255,255,255,0.14)',
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <Icon name={icon} size={36} color={fg} />
        </View>

        <View style={styles.textBox}>
          <Text variant="heading" bold color={fg}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="label" color={fg} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </A11yPressable>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBox: { flex: 1, gap: 4 },
  subtitle: { opacity: 0.92 },
});
