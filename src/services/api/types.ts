import type { LangCode } from '@/i18n/langs';

/** นิทานหนึ่งเรื่องแบบย่อ ใช้แสดงในคลังและหน้าแรก */
export type Tale = {
  id: string;
  title: string;
  /** สีพื้นของภาพปก ใช้ตอนยังไม่มีรูปจริง */
  coverColor: string;
  coverUrl?: string;
  /** ภาพปกสร้างโดย AI หรือไม่ — ต้องบอกผู้ใช้ตามหลักความโปร่งใส */
  coverIsAI: boolean;
  chapter: number;
  totalPages: number;
  durationMs: number;
  createdAt: number;
  source: 'photo' | 'file' | 'text';
  /** ภาษาต้นฉบับของเนื้อเรื่อง */
  lang: LangCode;
};

/** หนึ่งหน้าของนิทาน */
export type TalePage = {
  index: number;
  /** เนื้อความในภาษาต้นฉบับ */
  text: string;
  /** คำแปลรายภาษา ใช้ตอนสลับภาษาอ่าน */
  translations?: Partial<Record<LangCode, string>>;
  imageUrl?: string;
  imageIsAI?: boolean;
};

export type TaleDetail = Tale & { pages: TalePage[] };

/**
 * จุดเทียบเวลาระหว่างข้อความกับเสียง ใช้ไฮไลต์คำตามที่อ่าน
 * ถ้า backend ส่งมาไม่ได้ ฝั่งแอปจะประมาณเอาจากความยาวเสียง
 */
export type NarrationMark = {
  charStart: number;
  charEnd: number;
  timeMs: number;
};

export type PageNarration = {
  pageIndex: number;
  audioUrl: string;
  durationMs: number;
  marks?: NarrationMark[];
};

export type Narration = {
  taleId: string;
  lang: LangCode;
  voiceId: string;
  pages: PageNarration[];
};

export type JobStatus = 'queued' | 'reading' | 'translating' | 'narrating' | 'done' | 'failed';

export type Job = {
  id: string;
  status: JobStatus;
  /** 0 ถึง 1 */
  progress: number;
  taleId?: string;
  error?: string;
};

export type ChatRole = 'child' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  audioUrl?: string;
  createdAt: number;
};

export type ChatReply = {
  message: ChatMessage;
  /** คำถามที่แนะนำให้ถามต่อ แสดงเป็นชิปใต้บทสนทนา */
  suggestions: string[];
};

export type FilePayload = {
  uri: string;
  name: string;
  mimeType: string;
};

/**
 * สัญญาที่ฝั่งแอปคุยกับ backend
 * มีสองตัวที่ทำตามสัญญานี้: mock (ข้อมูลจำลอง) และ real (ยิง HTTP จริง)
 * หน้าจอไม่รู้ว่ากำลังใช้ตัวไหน จึงสลับได้โดยไม่ต้องแก้ UI
 */
export interface SigSentApi {
  /** ส่งรูปหน้าหนังสือหนึ่งหรือหลายหน้าไปทำ OCR แล้วสร้างนิทาน */
  ingestPhotos(uris: string[], lang: LangCode): Promise<Job>;
  ingestFile(file: FilePayload, lang: LangCode): Promise<Job>;
  ingestText(text: string, title: string, lang: LangCode): Promise<Job>;
  /** ถามสถานะงานที่กำลังประมวลผล */
  getJob(jobId: string): Promise<Job>;

  listTales(): Promise<Tale[]>;
  getTale(taleId: string): Promise<TaleDetail>;
  deleteTale(taleId: string): Promise<void>;

  /** ขอไฟล์เสียงอ่านของทั้งเรื่อง */
  getNarration(
    taleId: string,
    opts: { lang: LangCode; voiceId: string }
  ): Promise<Narration>;

  chat(
    taleId: string,
    opts: { message: string; pageIndex: number; lang: LangCode }
  ): Promise<ChatReply>;

  /** แปลงเสียงพูดของเด็กเป็นข้อความ */
  transcribe(audioUri: string, lang: LangCode): Promise<{ text: string }>;
}
