import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

type WaveformProps = {
  /** ความคืบหน้า 0 ถึง 1 แท่งที่ผ่านไปแล้วจะเข้มกว่า */
  progress: number;
  bars?: number;
};

/**
 * แถบคลื่นเสียงประกอบหน้าเล่นนิทาน
 *
 * เป็นของตกแต่งล้วน ๆ ปิดไม่ให้ screen reader อ่าน
 * ข้อมูลความคืบหน้าที่มีความหมายจริงถูกบอกผ่านข้อความและ accessibilityValue ของปุ่มเล่น
 */
export function Waveform({ progress, bars = 32 }: WaveformProps) {
  const theme = useTheme();

  // รูปคลื่นคงที่ตลอดอายุคอมโพเนนต์ ไม่สุ่มใหม่ทุกเฟรมเพื่อไม่ให้กะพริบ
  const heights = useMemo(
    () =>
      Array.from({ length: bars }, (_, i) => {
        const wave = Math.sin(i * 0.7) * 0.3 + Math.sin(i * 1.9) * 0.2;
        return 0.45 + Math.abs(wave);
      }),
    [bars]
  );

  const playedCount = Math.round(progress * bars);

  return (
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {heights.map((h, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            {
              height: `${Math.min(100, h * 100)}%`,
              backgroundColor: i < playedCount ? theme.colors.accent : theme.colors.surfaceAlt,
              borderRadius: 3,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    width: '100%',
  },
  bar: { flex: 1, marginHorizontal: 1.5 },
});
