/** ตรวจว่าเลือกฟอนต์ตามอักษรของข้อความได้ถูกต้อง รัน: npm run check:fonts */
import { fontForText, scriptOf } from '../src/theme/fontForText';

const cases: { text: string; expect: 'th' | 'ksw'; note: string }[] = [
  { text: 'สวัสดี พร้อมฟังนิทานหรือยัง', expect: 'th', note: 'ข้อความไทย' },
  { text: 'SigSent', expect: 'th', note: 'อักษรละติน' },
  { text: "Pgaz K'Nyau", expect: 'th', note: 'คำทับศัพท์ด้วยอักษรละติน' },
  { text: 'ကညီ', expect: 'ksw', note: 'อักษรพม่า (บล็อกหลัก)' },
  { text: 'ဖၠိၣ်', expect: 'ksw', note: 'อักษรพม่าพร้อมสระและวรรณยุกต์' },
  { text: 'ꩠ', expect: 'ksw', note: 'Myanmar Extended-B' },
  { text: 'ꧠ', expect: 'ksw', note: 'Myanmar Extended-A' },
];

let failed = 0;
for (const c of cases) {
  const got = scriptOf(c.text);
  const ok = got === c.expect;
  if (!ok) failed++;
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${c.note}: "${c.text}" -> ${got} (${fontForText(c.text)})`);
}
if (failed) {
  console.error(`\nไม่ผ่าน ${failed} กรณี`);
  process.exit(1);
}
console.log('\nผ่านทุกกรณี');

// ตรวจการตัดข้อความปนสองอักษร
import { splitByScript } from '../src/theme/fontForText';

const mixed = 'สวัสดี ကညီ ฟังนิทาน';
const runs = splitByScript(mixed);
console.log('\nตัดข้อความปนอักษร:', JSON.stringify(runs, null, 0));
if (runs.map((r) => r.text).join('') !== mixed) {
  console.error('ตัดแล้วข้อความไม่ครบ');
  process.exit(1);
}
if (runs.length !== 3 || runs[1].script !== 'ksw') {
  console.error('แบ่งช่วงไม่ถูกต้อง');
  process.exit(1);
}
console.log('ตัดข้อความปนอักษรถูกต้อง');
