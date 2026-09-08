import { Children } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { fonts, type TypeVariant } from '@/theme/tokens';
import { splitByScript } from '@/theme/fontForText';
import { useTheme } from '@/theme/useTheme';

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  bold?: boolean;
  /** ใช้สีนี้แทนสีข้อความปกติ (ต้องเป็นค่าที่ตรวจคอนทราสต์แล้ว) */
  color?: string;
  center?: boolean;
};

/** ดึงเฉพาะข้อความจริงออกมาจาก children เพื่อดูว่าเขียนด้วยอักษรอะไร */
function textOf(children: React.ReactNode): string {
  let out = '';
  Children.forEach(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') out += String(child);
  });
  return out;
}

/**
 * ข้อความทุกจุดในแอปต้องผ่านคอมโพเนนต์นี้
 * เพื่อให้ขยายตามขนาดที่ผู้ใช้เลือก และเลือกฟอนต์ตามอักษรของข้อความได้ถูกต้อง
 */
export function Text({
  variant = 'body',
  bold = false,
  color,
  center = false,
  style,
  children,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const base = theme.type(variant, { bold });
  const plain = textOf(children);
  const runs = splitByScript(plain);

  // ข้อความปนสองอักษรในประโยคเดียว (เช่น "สวัสดี ကညီ") ต้องแยกฟอนต์ทีละช่วง
  // ไม่งั้นอักษรของอีกภาษาจะกลายเป็นกล่องสี่เหลี่ยมบนมือถือ
  const mixed = runs.length > 1 && plain === String(children ?? '');

  return (
    <RNText
      // ปิด scaling ของระบบเพราะแอปมีตัวปรับขนาดของตัวเองแล้ว
      // ไม่งั้นจะคูณกันสองชั้นจนล้นจอ
      allowFontScaling={false}
      // อ่านทั้งประโยคเป็นก้อนเดียว ไม่ให้ screen reader อ่านทีละช่วงที่ตัดไว้
      accessibilityLabel={mixed ? plain : undefined}
      style={[
        base,
        { fontFamily: (bold ? fonts[runs[0].script].bold : fonts[runs[0].script].regular) },
        color ? { color } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
      {...rest}
    >
      {mixed
        ? runs.map((run, i) => (
            <RNText
              key={i}
              allowFontScaling={false}
              style={{
                fontFamily: bold ? fonts[run.script].bold : fonts[run.script].regular,
              }}
            >
              {run.text}
            </RNText>
          ))
        : children}
    </RNText>
  );
}
