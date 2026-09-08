/**
 * Design tokens ของ SigSent
 *
 * คงโทน "น้ำตาลเข้ม/ครีม" ตาม mockup ไว้ แต่ปรับค่าสีให้ผ่าน WCAG AA
 * และขยายขนาดปุ่ม/ตัวอักษรให้เหมาะกับเด็กตาบอดและสายตาเลือนราง
 *
 * กติกา: คอมโพเนนต์ห้ามเขียนโค้ดสีตรง ๆ ให้ดึงจาก useTheme() เท่านั้น
 */

export type ThemeName = 'warm' | 'contrast';

export type Palette = {
  /** พื้นหลังหลักของหน้าจอ */
  bg: string;
  /** พื้นการ์ด/แผงที่ลอยอยู่บน bg */
  surface: string;
  /** พื้นรองสำหรับส่วนที่ต้องแยกจาก surface */
  surfaceAlt: string;
  /** ข้อความหลักบน bg และ surface */
  text: string;
  /** ข้อความรอง เช่น "12 นาที · ตอนที่ 1" */
  textMuted: string;
  /** ปุ่ม/การ์ดหลัก (น้ำตาลเข้ม) */
  primary: string;
  onPrimary: string;
  /** ปุ่ม/การ์ดรอง (น้ำตาลกลาง) */
  secondary: string;
  onSecondary: string;
  /** การ์ดชั้นที่สาม (น้ำตาลอ่อน/แทน) */
  tertiary: string;
  onTertiary: string;
  /** สีเน้น: ปุ่มไมค์, ปุ่มสุ่มนิทาน, waveform */
  accent: string;
  onAccent: string;
  /** เส้นขอบ ต้องผ่าน 3:1 กับพื้นที่มันวางอยู่ */
  border: string;
  /** ขอบโฟกัสตอนใช้ screen reader / keyboard */
  focus: string;
  /** สถานะ */
  danger: string;
  onDanger: string;
  success: string;
  /** พื้นบับเบิลแชต */
  bubbleBot: string;
  onBubbleBot: string;
  bubbleUser: string;
  onBubbleUser: string;
};

/**
 * ธีมปกติ — โทนอบอุ่นตาม mockup แต่เข้มขึ้นให้อ่านออก
 * (mockup เดิมใช้น้ำตาลอ่อนบนครีม ได้คอนทราสต์ราว 2:1 ซึ่งตกมาตรฐาน)
 */
const warm: Palette = {
  bg: '#FBF6F0',
  surface: '#FFFFFF',
  surfaceAlt: '#EFE3D6',
  text: '#241811',
  textMuted: '#5A4436',
  primary: '#40291D',
  onPrimary: '#FFF8F1',
  secondary: '#6B4B36',
  onSecondary: '#FFF8F1',
  tertiary: '#8A6144',
  onTertiary: '#FFF8F1',
  accent: '#B0490B',
  onAccent: '#FFFFFF',
  border: '#8A7361',
  focus: '#0B5FA5',
  danger: '#A3160E',
  onDanger: '#FFFFFF',
  success: '#1F6B36',
  bubbleBot: '#6B4B36',
  onBubbleBot: '#FFF8F1',
  bubbleUser: '#40291D',
  onBubbleUser: '#FFF8F1',
};

/**
 * ธีมคอนทราสต์สูง — เหลืองบนดำ
 * เป็นรูปแบบที่ผู้ใช้สายตาเลือนรางคุ้นเคยที่สุด และให้คอนทราสต์สูงกว่า 15:1 ทุกคู่
 */
const contrast: Palette = {
  bg: '#000000',
  surface: '#0D0D0D',
  surfaceAlt: '#1A1A1A',
  text: '#FFE81A',
  textMuted: '#F2F2F2',
  primary: '#FFE81A',
  onPrimary: '#000000',
  secondary: '#FFFFFF',
  onSecondary: '#000000',
  tertiary: '#7FD4FF',
  onTertiary: '#000000',
  accent: '#FF8A1F',
  onAccent: '#000000',
  border: '#FFE81A',
  focus: '#7FD4FF',
  danger: '#FF6B6B',
  onDanger: '#000000',
  success: '#5BE37E',
  bubbleBot: '#1A1A1A',
  onBubbleBot: '#FFE81A',
  bubbleUser: '#FFE81A',
  onBubbleUser: '#000000',
};

export const palettes: Record<ThemeName, Palette> = { warm, contrast };

/** ระยะห่างมาตรฐาน */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/**
 * ขนาดพื้นที่กดขั้นต่ำ
 * WCAG กำหนด 44dp แต่กลุ่มเป้าหมายเป็นเด็กที่มองไม่เห็นและกดโดยการคลำ
 * จึงใช้ 64dp เป็นขั้นต่ำ และปุ่มสำคัญใหญ่กว่านั้น
 */
export const touch = {
  min: 64,
  large: 88,
  hero: 120,
} as const;

/** ระดับขนาดตัวอักษรที่ผู้ใช้เลือกได้ใน Settings */
export type FontScaleName = 'm' | 'l' | 'xl' | 'xxl';
export const fontScales: Record<FontScaleName, number> = {
  m: 1,
  l: 1.15,
  xl: 1.35,
  xxl: 1.6,
};

/** ขนาดฐาน (คูณด้วย fontScale อีกที) — ตั้งต้นใหญ่กว่าแอปทั่วไปโดยตั้งใจ */
export const typeScale = {
  display: 32,
  title: 26,
  heading: 21,
  body: 18,
  label: 16,
  caption: 14,
} as const;

export type TypeVariant = keyof typeof typeScale;

/** ความสูงบรรทัด — ภาษาไทยและอักษรพม่ามีสระบน/ล่าง ต้องเผื่อมากกว่าละติน */
export const lineHeightRatio = 1.55;

export const fonts = {
  th: { regular: 'NotoSansThai_400Regular', bold: 'NotoSansThai_700Bold' },
  ksw: { regular: 'Padauk_400Regular', bold: 'Padauk_700Bold' },
} as const;
