import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useSettings } from '@/store/settings';

export type HapticKind = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * การสั่นเป็นช่องทางตอบรับหลักของผู้ใช้ที่มองไม่เห็น
 * ทุกปุ่มจึงสั่นเสมอ เว้นแต่ผู้ใช้ปิดเองในหน้าตั้งค่า
 */
export function triggerHaptic(kind: HapticKind = 'light') {
  if (!useSettings.getState().hapticsEnabled) return;
  if (Platform.OS === 'web') return;

  switch (kind) {
    case 'light':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'medium':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'heavy':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'success':
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'warning':
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case 'error':
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
  }
}
