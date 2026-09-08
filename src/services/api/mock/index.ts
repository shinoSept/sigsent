import type { LangCode } from '@/i18n/langs';
import type {
  ChatReply,
  FilePayload,
  Job,
  Narration,
  SigSentApi,
  Tale,
  TaleDetail,
} from '../types';
import { MOCK_TALES } from './tales';

/**
 * ข้อมูลจำลองสำหรับพัฒนาและสาธิต ทำงานได้โดยไม่ต้องมี backend
 *
 * ตั้งใจให้เหมือนของจริง คือมีหน่วงเวลา และมีงานที่ค่อย ๆ คืบหน้า
 * เพื่อให้หน้าจอที่ต้องรอผลลัพธ์ถูกทดสอบจริง ไม่ใช่ผ่านเพราะข้อมูลมาทันที
 */

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** คลังในหน่วยความจำ เริ่มจากนิทานตัวอย่าง แล้วเพิ่มเรื่องใหม่ที่ผู้ใช้สร้างได้ */
const tales: TaleDetail[] = [...MOCK_TALES];

type MockJob = Job & { startedAt: number; pendingTale: TaleDetail };
const jobs = new Map<string, MockJob>();

let idCounter = 0;
const nextId = (prefix: string) => prefix + '-' + Date.now().toString(36) + '-' + idCounter++;

const COVER_COLORS = ['#C8763C', '#8A6144', '#6B4B36', '#40291D'];
const pickColor = () => COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)];

/** ตัดข้อความยาวออกเป็นหน้า ๆ ให้พอฟังไหวในหนึ่งช่วง */
function splitIntoPages(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return [text];

  const pages: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (current.length + sentence.length > 220 && current) {
      pages.push(current.trim());
      current = '';
    }
    current += (current ? ' ' : '') + sentence;
  }
  if (current.trim()) pages.push(current.trim());
  return pages;
}

/** ประมาณเวลาอ่าน ภาษาไทยราว 3.5 ตัวอักษรต่อวินาทีเมื่ออ่านให้เด็กฟัง */
function estimateDurationMs(text: string): number {
  return Math.max(4000, Math.round((text.length / 3.5) * 1000));
}

function createTaleFromText(
  title: string,
  body: string,
  lang: LangCode,
  source: Tale['source']
): TaleDetail {
  const pageTexts = splitIntoPages(body);
  return {
    id: nextId('tale'),
    title: title.trim() || 'นิทานไม่มีชื่อ',
    coverColor: pickColor(),
    coverIsAI: true,
    chapter: 1,
    totalPages: pageTexts.length,
    durationMs: pageTexts.reduce((sum, t) => sum + estimateDurationMs(t), 0),
    createdAt: Date.now(),
    source,
    lang,
    pages: pageTexts.map((text, index) => ({ index, text, imageIsAI: true })),
  };
}

function startJob(tale: TaleDetail): Job {
  const job: MockJob = {
    id: nextId('job'),
    status: 'queued',
    progress: 0,
    startedAt: Date.now(),
    pendingTale: tale,
  };
  jobs.set(job.id, job);
  return { id: job.id, status: job.status, progress: job.progress };
}

/** งานจำลองใช้เวลาราว 6 วินาที ไล่สถานะไปตามขั้นตอนจริงของ backend */
const JOB_TOTAL_MS = 6000;
const JOB_STAGES: { until: number; status: Job['status'] }[] = [
  { until: 0.15, status: 'queued' },
  { until: 0.45, status: 'reading' },
  { until: 0.75, status: 'translating' },
  { until: 1.0, status: 'narrating' },
];

/** คำตอบจำลอง ดูคำในคำถามแล้วเลือกรูปแบบคำตอบให้พอสมเหตุสมผลตอนสาธิต */
function fakeAnswer(question: string, tale: TaleDetail, pageIndex: number): string {
  const page = tale.pages[Math.min(pageIndex, tale.pages.length - 1)];
  const nextPage = tale.pages[pageIndex + 1];
  const q = question.trim();

  if (/ต่อ|ถัดไป|แล้วไง|เกิดอะไร/.test(q)) {
    return nextPage
      ? 'ต่อจากนี้ ' + nextPage.text
      : 'หน้านี้เป็นตอนจบของเรื่อง ' + tale.title + ' แล้วนะ อยากให้อ่านเรื่องนี้อีกครั้งไหม';
  }
  if (/อีกครั้ง|ซ้ำ|อ่านใหม่|ทวน/.test(q)) {
    return page.text;
  }
  if (/แปลว่า|หมายความว่า|คืออะไร|อธิบาย/.test(q)) {
    const quoted = q.match(/"([^"]+)"/);
    const word = quoted
      ? quoted[1]
      : q.replace(/แปลว่าอะไร|หมายความว่าอะไร|คืออะไร|อธิบายคำว่า/g, '').trim();
    return word
      ? 'คำว่า ' + word + ' ในเรื่องนี้ หมายถึงสิ่งที่ตัวละครกำลังทำหรือรู้สึกอยู่ตอนนี้ ลองฟังประโยคนี้อีกครั้งนะ ' + page.text
      : 'ลองบอกคำที่อยากให้อธิบายอีกครั้งได้ไหม';
  }
  if (/ใคร|ตัวละคร/.test(q)) {
    return 'ในเรื่อง ' + tale.title + ' หน้านี้พูดถึงตัวละครที่กำลังทำสิ่งนี้อยู่ ' + page.text;
  }
  if (/ทำไม|เพราะอะไร/.test(q)) {
    return 'เป็นเพราะสิ่งที่เกิดขึ้นก่อนหน้านี้ในเรื่อง ลองฟังตรงนี้อีกครั้งนะ ' + page.text;
  }
  return (
    'เรากำลังอ่านเรื่อง ' + tale.title + ' อยู่ที่หน้า ' + (pageIndex + 1) + ' ตอนนี้เล่าว่า ' + page.text
  );
}

function suggestionsFor(tale: TaleDetail, pageIndex: number): string[] {
  const isLast = pageIndex >= tale.pages.length - 1;
  return [
    isLast ? 'สรุปเรื่องนี้ให้ฟังหน่อย' : 'เกิดอะไรขึ้นต่อ',
    'อ่านอีกครั้ง',
    'ตัวละครในเรื่องนี้มีใครบ้าง',
  ];
}

export const mockApi: SigSentApi = {
  async ingestPhotos(uris, lang) {
    await delay(400);
    const body =
      'นี่คือเนื้อเรื่องที่อ่านได้จากรูปถ่าย ' +
      uris.length +
      ' หน้า ในการใช้งานจริงข้อความส่วนนี้จะมาจากระบบอ่านตัวอักษรของเซิร์ฟเวอร์. ระหว่างนี้เราใส่เนื้อความตัวอย่างไว้ให้ทดสอบการอ่านออกเสียงได้ครบทุกขั้นตอน. เมื่อเชื่อมต่อเซิร์ฟเวอร์จริงแล้ว ข้อความตรงนี้จะถูกแทนที่โดยอัตโนมัติ.';
    return startJob(createTaleFromText('นิทานจากรูปถ่าย ' + uris.length + ' หน้า', body, lang, 'photo'));
  },

  async ingestFile(file: FilePayload, lang) {
    await delay(500);
    const body =
      'นี่คือเนื้อเรื่องที่อ่านได้จากไฟล์ ' +
      file.name +
      '. ในการใช้งานจริงเซิร์ฟเวอร์จะแกะข้อความจากไฟล์แล้วส่งกลับมาให้แอปอ่านออกเสียง. ตอนนี้เป็นข้อความตัวอย่างเพื่อให้ทดสอบขั้นตอนได้ครบ.';
    const title = file.name.replace(/\.[^.]+$/, '');
    return startJob(createTaleFromText(title, body, lang, 'file'));
  },

  async ingestText(text, title, lang) {
    await delay(300);
    return startJob(createTaleFromText(title, text, lang, 'text'));
  },

  async getJob(jobId) {
    const job = jobs.get(jobId);
    if (!job) return { id: jobId, status: 'failed', progress: 0, error: 'ไม่พบงานนี้' };

    const elapsed = Date.now() - job.startedAt;
    const progress = Math.min(1, elapsed / JOB_TOTAL_MS);

    if (progress >= 1) {
      // เพิ่มเข้าคลังเมื่อทำเสร็จแล้วเท่านั้น เพื่อไม่ให้เห็นนิทานที่ยังไม่มีเสียง
      if (!tales.some((t) => t.id === job.pendingTale.id)) {
        tales.unshift(job.pendingTale);
      }
      return { id: job.id, status: 'done', progress: 1, taleId: job.pendingTale.id };
    }

    const stage = JOB_STAGES.find((s) => progress <= s.until) ?? JOB_STAGES[0];
    return { id: job.id, status: stage.status, progress };
  },

  async listTales() {
    await delay(250);
    return tales.map(({ pages: _pages, ...tale }) => tale);
  },

  async getTale(taleId) {
    await delay(200);
    const tale = tales.find((t) => t.id === taleId);
    if (!tale) throw new Error('ไม่พบนิทานรหัส ' + taleId);
    return tale;
  },

  async deleteTale(taleId) {
    await delay(150);
    const index = tales.findIndex((t) => t.id === taleId);
    if (index >= 0) tales.splice(index, 1);
  },

  async getNarration(taleId, opts): Promise<Narration> {
    await delay(350);
    const tale = tales.find((t) => t.id === taleId);
    if (!tale) throw new Error('ไม่พบนิทานรหัส ' + taleId);

    // ข้อมูลจำลองไม่มีไฟล์เสียงจริง จึงส่ง audioUrl เป็นค่าว่าง
    // ตัวเล่นเสียงเห็นค่าว่างแล้วจะสลับไปใช้เสียงสังเคราะห์ในเครื่องแทนเอง
    return {
      taleId,
      lang: opts.lang,
      voiceId: opts.voiceId,
      pages: tale.pages.map((page) => ({
        pageIndex: page.index,
        audioUrl: '',
        durationMs: estimateDurationMs(page.text),
      })),
    };
  },

  async chat(taleId, opts): Promise<ChatReply> {
    // หน่วงให้เห็นสถานะ กำลังคิดคำตอบ ชัดเจน
    await delay(900);
    const tale = tales.find((t) => t.id === taleId);
    if (!tale) throw new Error('ไม่พบนิทานรหัส ' + taleId);

    return {
      message: {
        id: nextId('msg'),
        role: 'assistant',
        text: fakeAnswer(opts.message, tale, opts.pageIndex),
        createdAt: Date.now(),
      },
      suggestions: suggestionsFor(tale, opts.pageIndex),
    };
  },

  async transcribe(_audioUri, _lang) {
    await delay(800);
    // ข้อมูลจำลองไม่ได้ถอดเสียงจริง จึงสุ่มคำถามที่เด็กมักถามมาให้ทดสอบขั้นตอน
    const samples = [
      'เกิดอะไรขึ้นต่อ',
      'อ่านอีกครั้ง',
      'ตัวละครในเรื่องนี้มีใครบ้าง',
      'ทำไมถึงเป็นแบบนั้น',
    ];
    return { text: samples[Math.floor(Math.random() * samples.length)] };
  },
};
