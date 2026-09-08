/**
 * ตรวจว่าทุกคู่สีใน palette ผ่าน WCAG AA จริง
 * รัน: npm run check:contrast
 */
import { contrastRatio } from '../src/theme/contrast';
import { palettes, type Palette, type ThemeName } from '../src/theme/tokens';

type Check = { name: string; fg: keyof Palette; bg: keyof Palette; min: number };

const checks: Check[] = [
  { name: 'ข้อความหลักบนพื้นหลัง', fg: 'text', bg: 'bg', min: 4.5 },
  { name: 'ข้อความหลักบนการ์ดขาว', fg: 'text', bg: 'surface', min: 4.5 },
  { name: 'ข้อความหลักบนพื้นรอง', fg: 'text', bg: 'surfaceAlt', min: 4.5 },
  { name: 'ข้อความรองบนพื้นหลัง', fg: 'textMuted', bg: 'bg', min: 4.5 },
  { name: 'ข้อความรองบนการ์ดขาว', fg: 'textMuted', bg: 'surface', min: 4.5 },
  { name: 'ข้อความรองบนพื้นรอง', fg: 'textMuted', bg: 'surfaceAlt', min: 4.5 },
  { name: 'ตัวอักษรบนปุ่มหลัก', fg: 'onPrimary', bg: 'primary', min: 4.5 },
  { name: 'ตัวอักษรบนปุ่มรอง', fg: 'onSecondary', bg: 'secondary', min: 4.5 },
  { name: 'ตัวอักษรบนการ์ดชั้นสาม', fg: 'onTertiary', bg: 'tertiary', min: 4.5 },
  { name: 'ไอคอนบนปุ่มเน้น (ไมค์/สุ่ม)', fg: 'onAccent', bg: 'accent', min: 4.5 },
  { name: 'ตัวอักษรบนปุ่มลบ', fg: 'onDanger', bg: 'danger', min: 4.5 },
  { name: 'บับเบิลฝั่ง AI', fg: 'onBubbleBot', bg: 'bubbleBot', min: 4.5 },
  { name: 'บับเบิลฝั่งเด็ก', fg: 'onBubbleUser', bg: 'bubbleUser', min: 4.5 },
  // องค์ประกอบที่ไม่ใช่ข้อความ ใช้เกณฑ์ 3:1
  { name: 'เส้นขอบบนพื้นหลัง', fg: 'border', bg: 'bg', min: 3 },
  { name: 'เส้นขอบบนการ์ดขาว', fg: 'border', bg: 'surface', min: 3 },
  { name: 'ขอบโฟกัสบนพื้นหลัง', fg: 'focus', bg: 'bg', min: 3 },
  { name: 'ปุ่มหลักบนพื้นหลัง', fg: 'primary', bg: 'bg', min: 3 },
  { name: 'ปุ่มเน้นบนพื้นหลัง', fg: 'accent', bg: 'bg', min: 3 },
];

let failed = 0;
for (const themeName of Object.keys(palettes) as ThemeName[]) {
  const p = palettes[themeName];
  console.log(`\n=== ธีม: ${themeName} ===`);
  for (const c of checks) {
    const ratio = contrastRatio(p[c.fg], p[c.bg]);
    const ok = ratio >= c.min;
    if (!ok) failed++;
    const mark = ok ? 'PASS' : 'FAIL';
    console.log(
      `  [${mark}] ${ratio.toFixed(2).padStart(5)}:1 (ต้อง ${c.min}) — ${c.name}  ${p[c.fg]} บน ${p[c.bg]}`
    );
  }
}

if (failed > 0) {
  console.error(`\nไม่ผ่าน ${failed} คู่ — ต้องแก้ palette ก่อน`);
  process.exit(1);
}
console.log('\nผ่านทุกคู่ ✓');
