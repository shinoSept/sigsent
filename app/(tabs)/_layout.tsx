import { Tabs } from 'expo-router';
import { Platform, type ColorValue } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';
import { fonts } from '@/theme/tokens';
import { useSettings } from '@/store/settings';

/**
 * แถบเมนูล่าง 4 ปุ่มตามโครงที่ออกแบบไว้
 *
 * ปุ่มสูง 76dp ซึ่งใหญ่กว่าค่ามาตรฐานของระบบ เพราะเป็นทางเดินหลักของแอป
 * และผู้ใช้ต้องกดโดยอาศัยตำแหน่งที่จำได้ ไม่ได้มองหา
 */
export default function TabsLayout() {
  const theme = useTheme();
  const t = useT();
  const uiLang = useSettings((s) => s.uiLang);

  const tab =
    (name: IconName) =>
    ({ color, size }: { color: ColorValue; size: number }) => (
      <Icon name={name} size={size + 4} color={String(color)} />
    );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.isHighContrast ? theme.colors.text : theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: theme.isHighContrast ? 2 : 1,
          height: Platform.OS === 'ios' ? 96 : 76,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
        tabBarLabelStyle: {
          // ป้ายในแท็บมีความกว้างจำกัด ขยายเต็มที่ตามการตั้งค่าแล้วจะโดนตัดคำ
          // จึงจำกัดตัวคูณไว้ที่ 1.15 ส่วนข้อความเต็มยังถูกอ่านโดย screen reader ครบอยู่
          fontFamily: fonts[uiLang].bold,
          fontSize: Math.round(13 * Math.min(theme.scale, 1.15)),
        },
        tabBarItemStyle: { minHeight: 64 },
        tabBarAccessibilityLabel: undefined,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.home'), tabBarIcon: tab('home') }}
      />
      <Tabs.Screen
        name="library"
        options={{ title: t('tabs.library'), tabBarIcon: tab('library') }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: t('tabs.chat'), tabBarIcon: tab('chat') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t('tabs.settings'), tabBarIcon: tab('settings') }}
      />
    </Tabs>
  );
}
