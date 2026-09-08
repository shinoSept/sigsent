import {
  NotoSansThai_400Regular,
  NotoSansThai_700Bold,
} from '@expo-google-fonts/noto-sans-thai';
import { Padauk_400Regular, Padauk_700Bold } from '@expo-google-fonts/padauk';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { I18nProvider } from '@/i18n';
import { useSettings } from '@/store/settings';
import { palettes } from '@/theme/tokens';

/**
 * รากของแอป
 *
 * โหลดฟอนต์ก่อนแสดงหน้าจอใด ๆ เพราะภาษาไทยและอักษรที่ใช้เขียนปกาเกอะญอ
 * ต้องใช้ฟอนต์ที่ bundle มาเอง ถ้าปล่อยให้ระบบเลือกเองจะได้กล่องสี่เหลี่ยมแทนตัวอักษร
 */
export default function RootLayout() {
  const themeName = useSettings((s) => s.themeName);
  const colors = palettes[themeName];

  const [fontsLoaded, fontError] = useFonts({
    NotoSansThai_400Regular,
    NotoSansThai_700Bold,
    // Padauk เป็นฟอนต์ของ SIL ที่วางสระและวรรณยุกต์ของภาษากะเหรี่ยงได้ถูกต้อง
    // ต่างจาก Noto Sans Myanmar ที่วางผิดตำแหน่งในภาษานี้
    Padauk_400Regular,
    Padauk_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}
        accessibilityLabel="กำลังเปิดแอป"
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
          <StatusBar style={themeName === 'contrast' ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="add" />
            <Stack.Screen name="tale" />
          </Stack>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
