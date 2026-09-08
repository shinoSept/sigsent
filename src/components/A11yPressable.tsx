import { useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { triggerHaptic, type HapticKind } from '@/utils/haptics';
import { touch } from '@/theme/tokens';

export type A11yPressableProps = {
  /** บังคับใส่ — screen reader จะอ่านค่านี้ให้เด็กฟัง ห้ามปล่อยว่าง */
  accessibilityLabel: string;
  /** บอกว่ากดแล้วจะเกิดอะไร เช่น "แตะเพื่อเปิดฟังนิทานเรื่องนี้" */
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: { selected?: boolean; disabled?: boolean; checked?: boolean };
  /** ค่าปัจจุบันของตัวควบคุม เช่น สไลเดอร์ความเร็ว */
  accessibilityValue?: { text?: string; min?: number; max?: number; now?: number };
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  onPressIn?: (e: GestureResponderEvent) => void;
  onPressOut?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  haptic?: HapticKind | 'none';
  /** ขนาดพื้นที่กดขั้นต่ำ ค่าเริ่มต้น 64dp ตามที่ตกลงไว้สำหรับกลุ่มผู้ใช้นี้ */
  minSize?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  testID?: string;
};

/**
 * ปุ่มกลางของแอป — ทุกสิ่งที่กดได้ต้องใช้ตัวนี้ ห้ามใช้ TouchableOpacity ดิบ
 *
 * รับประกันสามอย่างที่กลุ่มผู้ใช้ต้องการ:
 * 1. มี label ให้ screen reader อ่านเสมอ (TypeScript บังคับ)
 * 2. พื้นที่กดไม่เล็กกว่า 64dp แม้ตัวการ์ดจะเล็กกว่านั้น
 * 3. สั่นตอบรับทุกครั้ง เพื่อยืนยันว่ากดโดนโดยไม่ต้องมอง
 */
export function A11yPressable({
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  accessibilityValue,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disabled = false,
  haptic = 'light',
  minSize = touch.min,
  style,
  children,
  testID,
}: A11yPressableProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const handlePress = (e: GestureResponderEvent) => {
    if (disabled) return;
    if (haptic !== 'none') triggerHaptic(haptic);
    onPress?.(e);
  };

  return (
    <Pressable
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled, ...accessibilityState }}
      accessibilityValue={accessibilityValue}
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      // ขอบโฟกัสต้องมองเห็นได้ชัดสำหรับผู้ใช้ที่ยังพอมองเห็น
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={disabled}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        { minHeight: minSize, minWidth: minSize },
        style,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        focused
          ? { borderWidth: 3, borderColor: theme.colors.focus }
          : null,
      ]}
    >
      {/* ห่อไว้ชั้นหนึ่งเพื่อไม่ให้ screen reader ไล่อ่านลูก ๆ ทีละชิ้น
          ปุ่มหนึ่งปุ่มควรถูกอ่านเป็นหน่วยเดียว */}
      <View style={styles.inner} importantForAccessibility="no-hide-descendants">
        {children}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
  },
  inner: {
    flexShrink: 1,
    width: '100%',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
