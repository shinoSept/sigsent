import { useMemo } from 'react';
import { type TextStyle } from 'react-native';

import { useSettings } from '@/store/settings';
import {
  fontScales,
  fonts,
  lineHeightRatio,
  palettes,
  radius,
  space,
  touch,
  typeScale,
  type Palette,
  type TypeVariant,
} from './tokens';

export type Theme = {
  colors: Palette;
  space: typeof space;
  radius: typeof radius;
  touch: typeof touch;
  /** ตัวคูณขนาดตัวอักษรที่ผู้ใช้เลือก */
  scale: number;
  /**
   * สร้างสไตล์ข้อความจากตัวแปรที่กำหนด
   * ใช้แทนการเขียน fontSize เองทุกที่ เพื่อให้ทุกข้อความขยายตามการตั้งค่า
   */
  type: (variant: TypeVariant, opts?: { bold?: boolean }) => TextStyle;
  isHighContrast: boolean;
};

export function useTheme(): Theme {
  const themeName = useSettings((s) => s.themeName);
  const fontScale = useSettings((s) => s.fontScale);
  const uiLang = useSettings((s) => s.uiLang);

  return useMemo(() => {
    const colors = palettes[themeName];
    const scale = fontScales[fontScale];
    const family = fonts[uiLang];

    const type = (variant: TypeVariant, opts?: { bold?: boolean }): TextStyle => {
      const size = Math.round(typeScale[variant] * scale);
      return {
        fontSize: size,
        lineHeight: Math.round(size * lineHeightRatio),
        fontFamily: opts?.bold ? family.bold : family.regular,
        color: colors.text,
      };
    };

    return {
      colors,
      space,
      radius,
      touch,
      scale,
      type,
      isHighContrast: themeName === 'contrast',
    };
  }, [themeName, fontScale, uiLang]);
}
