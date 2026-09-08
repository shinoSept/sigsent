/**
 * WCAG 2.1 relative-luminance / contrast-ratio helpers.
 *
 * กลุ่มผู้ใช้เป็นเด็ก low-vision ทุกคู่สีจึงต้องผ่านมาตรฐานจริง ไม่ใช่กะเอา
 * ใช้ตรวจ palette ได้ด้วย `npm run check:contrast`
 */

export type Rgb = { r: number; g: number; b: number };

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** WCAG relative luminance (sRGB) */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** อัตราส่วนคอนทราสต์ 1–21 */
export function contrastRatio(fg: string, bg: string): number {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** ข้อความปกติต้อง >= 4.5:1 */
export const passesAA = (fg: string, bg: string) => contrastRatio(fg, bg) >= 4.5;
/** ข้อความใหญ่ (>=18pt bold / 24px) และไอคอน/ขอบ ต้อง >= 3:1 */
export const passesAALarge = (fg: string, bg: string) => contrastRatio(fg, bg) >= 3;
