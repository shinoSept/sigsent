/**
 * ภาษาที่แอปรองรับ
 * th  = ไทย
 * ksw = ปกาเกอะญอสะกอ (S'gaw Karen) ตามรหัส ISO 639-3
 */
export const LANGS = ['th', 'ksw'] as const;
export type LangCode = (typeof LANGS)[number];

export const LANG_LABELS: Record<LangCode, { native: string; th: string }> = {
  th: { native: 'ไทย', th: 'ภาษาไทย' },
  // TODO(ทีม): แทนที่ native ด้วยชื่อภาษาที่เขียนด้วยอักษรจริงจากเจ้าของภาษา
  //            ตอนนี้ใช้คำทับศัพท์ไว้ก่อน เพราะเดาอักษรเองแล้วผิดจะเสียหายกว่า
  ksw: { native: "Pgaz K'Nyau", th: 'ภาษาปกาเกอะญอ' },
};

/** BCP-47 ที่ส่งให้ TTS ในเครื่อง (ปกาเกอะญอไม่มีในเครื่อง จึงตกไปใช้ไทย) */
export const DEVICE_TTS_LOCALE: Record<LangCode, string> = {
  th: 'th-TH',
  ksw: 'th-TH',
};
