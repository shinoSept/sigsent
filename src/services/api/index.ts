import { mockApi } from './mock';
import { realApi } from './real';
import type { SigSentApi } from './types';

/**
 * จุดสลับระหว่างข้อมูลจำลองกับ backend จริง
 *
 * ตั้งค่าได้ในไฟล์ .env
 *   EXPO_PUBLIC_USE_MOCK=1  ใช้ข้อมูลจำลอง (ค่าเริ่มต้น ทำงานได้โดยไม่ต้องมีเซิร์ฟเวอร์)
 *   EXPO_PUBLIC_USE_MOCK=0  ยิงไปที่ EXPO_PUBLIC_API_URL
 *
 * เมื่อ backend ของเพื่อนพร้อม เปลี่ยนแค่บรรทัดเดียวใน .env แล้วรีสตาร์ท
 */
export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== '0';

export const api: SigSentApi = USE_MOCK ? mockApi : realApi;

export * from './types';
