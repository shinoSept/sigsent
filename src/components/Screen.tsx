import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';
import { useScreenAnnouncement } from '@/utils/announce';
import { A11yPressable } from './A11yPressable';
import { Icon } from './Icon';
import { Text } from './Text';

type ScreenProps = {
  /** ชื่อหน้าจอ จะถูกอ่านให้ผู้ใช้ screen reader ฟังเมื่อเปิดหน้า */
  title: string;
  /** ข้อความเสริมที่อ่านต่อจากชื่อหน้า เช่น จำนวนรายการที่มี */
  announcement?: string;
  showBack?: boolean;
  /** ปุ่มมุมขวาบน */
  action?: {
    icon: Parameters<typeof Icon>[0]['name'];
    label: string;
    hint?: string;
    onPress: () => void;
  };
  /** ปิดการเลื่อนเมื่อหน้าจอจัดการ layout เอง เช่น หน้ากล้องหรือหน้าแชต */
  scroll?: boolean;
  children: ReactNode;
};

/**
 * โครงหน้าจอมาตรฐาน
 *
 * รวมสามอย่างที่ทุกหน้าต้องมีไว้ที่เดียว เพื่อไม่ให้หน้าใดหน้าหนึ่งลืม
 *   - ประกาศชื่อหน้าให้ screen reader เมื่อเปิดหน้า
 *   - ปุ่มย้อนกลับที่มี label ครบและใหญ่พอจะกดโดยไม่ต้องมอง
 *   - หัวข้อที่ถูกทำเครื่องหมายเป็น header ให้เครื่องมือช่วยอ่านกระโดดถึงได้
 */
export function Screen({
  title,
  announcement,
  showBack = false,
  action,
  scroll = true,
  children,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const t = useT();

  useScreenAnnouncement(title, announcement);

  const header = (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          paddingTop: insets.top + theme.space.sm,
          paddingHorizontal: theme.space.lg,
          paddingBottom: theme.space.md,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      {showBack ? (
        <A11yPressable
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
          style={[styles.headerButton, { backgroundColor: theme.colors.surfaceAlt }]}
        >
          <Icon name="back" size={28} color={theme.colors.text} />
        </A11yPressable>
      ) : (
        <View style={styles.headerSpacer} />
      )}

      <View style={styles.headerTitle}>
        <Text
          variant="title"
          bold
          center
          numberOfLines={2}
          accessibilityRole="header"
        >
          {title}
        </Text>
      </View>

      {action ? (
        <A11yPressable
          accessibilityLabel={action.label}
          accessibilityHint={action.hint}
          onPress={action.onPress}
          style={[styles.headerButton, { backgroundColor: theme.colors.surfaceAlt }]}
        >
          <Icon name={action.icon} size={28} color={theme.colors.text} />
        </A11yPressable>
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      {header}
      {scroll ? (
        <ScrollView
          style={styles.body}
          contentContainerStyle={{
            padding: theme.space.lg,
            paddingBottom: theme.space.xxxl,
            gap: theme.space.lg,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.body}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    width: 56,
    height: 56,
    minWidth: 56,
    minHeight: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { width: 56, height: 56 },
  headerTitle: { flex: 1 },
  body: { flex: 1 },
});
