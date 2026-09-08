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

/**
 * ตัวเชื่อมกับ backend จริงของทีม
 *
 * ไฟล์นี้เป็นที่เดียวที่รู้จักรูปแบบ HTTP ของเซิร์ฟเวอร์
 * ถ้า spec ที่เพื่อนทำออกมาต่างจากนี้ ให้แก้เฉพาะไฟล์นี้ หน้าจอทั้งหมดไม่ต้องแตะ
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

/** ยกเลิกคำขอที่ค้างนานเกินไป ไม่งั้นเด็กจะรออยู่หน้าจอโดยไม่มีอะไรเกิดขึ้น */
const TIMEOUT_MS = 30_000;

class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(BASE_URL + path, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...init?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ApiError(
        'เซิร์ฟเวอร์ตอบกลับผิดพลาด ' + res.status + (body ? ': ' + body.slice(0, 200) : ''),
        res.status
      );
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ ใช้เวลานานเกินไป');
    }
    if (err instanceof ApiError) throw err;
    throw new ApiError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
  } finally {
    clearTimeout(timer);
  }
}

/** แนบไฟล์แบบ multipart ตามรูปแบบที่ React Native ใช้ */
function appendFile(form: FormData, field: string, file: FilePayload) {
  form.append(field, {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);
}

export const realApi: SigSentApi = {
  async ingestPhotos(uris: string[], lang: LangCode) {
    const form = new FormData();
    form.append('lang', lang);
    uris.forEach((uri, i) => {
      appendFile(form, 'pages', {
        uri,
        name: 'page-' + (i + 1) + '.jpg',
        mimeType: 'image/jpeg',
      });
    });
    return request<Job>('/ingest/photo', { method: 'POST', body: form });
  },

  async ingestFile(file: FilePayload, lang: LangCode) {
    const form = new FormData();
    form.append('lang', lang);
    appendFile(form, 'file', file);
    return request<Job>('/ingest/file', { method: 'POST', body: form });
  },

  async ingestText(text: string, title: string, lang: LangCode) {
    return request<Job>('/ingest/text', {
      method: 'POST',
      body: JSON.stringify({ text, title, lang }),
    });
  },

  async getJob(jobId: string) {
    return request<Job>('/jobs/' + encodeURIComponent(jobId));
  },

  async listTales() {
    return request<Tale[]>('/tales');
  },

  async getTale(taleId: string) {
    return request<TaleDetail>('/tales/' + encodeURIComponent(taleId));
  },

  async deleteTale(taleId: string) {
    await request<void>('/tales/' + encodeURIComponent(taleId), { method: 'DELETE' });
  },

  async getNarration(taleId: string, opts: { lang: LangCode; voiceId: string }) {
    return request<Narration>('/tales/' + encodeURIComponent(taleId) + '/narration', {
      method: 'POST',
      body: JSON.stringify({ lang: opts.lang, voice: opts.voiceId }),
    });
  },

  async chat(taleId: string, opts: { message: string; pageIndex: number; lang: LangCode }) {
    return request<ChatReply>('/tales/' + encodeURIComponent(taleId) + '/chat', {
      method: 'POST',
      body: JSON.stringify(opts),
    });
  },

  async transcribe(audioUri: string, lang: LangCode) {
    const form = new FormData();
    form.append('lang', lang);
    appendFile(form, 'audio', {
      uri: audioUri,
      name: 'question.m4a',
      mimeType: 'audio/m4a',
    });
    return request<{ text: string }>('/stt', { method: 'POST', body: form });
  },
};
