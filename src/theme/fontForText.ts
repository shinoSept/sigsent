import { fonts } from './tokens';
import type { LangCode } from '@/i18n/langs';

/**
 * เลือกฟอนต์จากตัวอักษรที่อยู่ในข้อความจริง ไม่ใช่จากภาษาที่ผู้ใช้ตั้งไว้
 *
 * เหตุผล: Padauk ไม่มีตัวอักษรไทย และ Noto Sans Thai ไม่มีอักษรพม่า
 * เมื่อผู้ใช้เลือกภาษาปกาเกอะญอ ข้อความที่ยังไม่มีคำแปลจะถอยไปเป็นภาษาไทย
 * ถ้าเลือกฟอนต์ตามภาษาที่ตั้งไว้ ข้อความไทยเหล่านั้นจะกลายเป็นกล่องสี่เหลี่ยมทั้งหมด
 * จึงต้องดูว่าข้อความตรงหน้าเขียนด้วยอักษรอะไร แล้วค่อยเลือกฟอนต์ให้ตรง
 *
 * ข้อความที่ปนสองอักษรในประโยคเดียว เช่น "สวัสดี ကညီ" เกิดขึ้นจริงเสมอ
 * เพราะชื่อเด็กและชื่อนิทานเป็นปกาเกอะญอ แต่ข้อความรอบ ๆ ยังเป็นไทย
 * จึงมี splitByScript() ไว้ตัดเป็นช่วง ๆ ให้แต่ละช่วงใช้ฟอนต์ของตัวเอง
 * (เบราว์เซอร์เลือกฟอนต์สำรองให้เองได้ แต่ React Native บนมือถือทำไม่ได้)
 */

/** ช่วงรหัสของอักษรพม่าที่ใช้เขียนปกาเกอะญอ รวมส่วนขยายทั้งหมด */
const MYANMAR_CHAR = /[က-႟ꧠ-꧿ꩠ-ꩿ]/;
const MYANMAR_RUN = /[က-႟ꧠ-꧿ꩠ-ꩿ]+/g;

export function scriptOf(text: string): LangCode {
  return MYANMAR_CHAR.test(text) ? 'ksw' : 'th';
}

/** ชื่อฟอนต์ที่เหมาะกับข้อความนี้ */
export function fontForText(text: string, bold = false): string {
  const family = fonts[scriptOf(text)];
  return bold ? family.bold : family.regular;
}

export type ScriptRun = { text: string; script: LangCode };

/**
 * ตัดข้อความเป็นช่วงตามอักษรที่ใช้
 * ถ้าทั้งข้อความเป็นอักษรเดียวจะคืนช่วงเดียว ซึ่งเป็นกรณีส่วนใหญ่
 */
export function splitByScript(text: string): ScriptRun[] {
  if (!MYANMAR_CHAR.test(text)) return [{ text, script: 'th' }];

  const runs: ScriptRun[] = [];
  let last = 0;
  MYANMAR_RUN.lastIndex = 0;

  for (let m = MYANMAR_RUN.exec(text); m !== null; m = MYANMAR_RUN.exec(text)) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index), script: 'th' });
    runs.push({ text: m[0], script: 'ksw' });
    last = m.index + m[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last), script: 'th' });

  return runs;
}
