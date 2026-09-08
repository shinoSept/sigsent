/**
 * ข้อความภาษาปกาเกอะญอสะกอ (S'gaw Karen)
 *
 * สำคัญ: ไฟล์นี้ตั้งใจเว้นว่างไว้ให้เจ้าของภาษาเป็นคนเติม
 * คีย์ไหนที่ยังไม่มีคำแปล ระบบจะถอยไปใช้ภาษาไทยให้อัตโนมัติ
 * (ดู resolve() ใน src/i18n/index.tsx) — จึงเติมทีละคีย์ได้เลย ไม่ต้องแปลครบก่อนใช้งาน
 *
 * วิธีเติม: คัดลอกโครงสร้างจาก th.ts มาแล้วใส่เฉพาะคีย์ที่แปลแล้ว เช่น
 *   export const ksw: DeepPartial<Translations> = {
 *     tabs: { home: '...' },
 *   };
 */
import type { Translations } from './th';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export const ksw: DeepPartial<Translations> = {
  // TODO(เจ้าของภาษา): เติมคำแปลปกาเกอะญอที่นี่
};
