import type { NarrationMark } from '@/services/api/types';

/** ข้อมูลหนึ่งหน้าที่ตัวเล่นเสียงต้องใช้ */
export type NarratorPage = {
  index: number;
  /** ข้อความของหน้านี้ ใช้ทั้งไฮไลต์คำและอ่านด้วยเสียงในเครื่องตอนไม่มีไฟล์เสียง */
  text: string;
  /** ลิงก์ไฟล์เสียงจาก backend ค่าว่างแปลว่ายังไม่มี ให้ใช้เสียงในเครื่องแทน */
  audioUrl: string;
  durationMs: number;
  marks?: NarrationMark[];
};

/** แหล่งเสียงที่กำลังใช้จริง แสดงให้ผู้ใช้ทราบได้ในหน้าตั้งค่า */
export type NarratorEngine = 'remote' | 'device';

export type NarratorState = {
  isPlaying: boolean;
  isLoading: boolean;
  /** หน้าที่กำลังอ่านอยู่ */
  pageIndex: number;
  /** ตำแหน่งเวลาภายในหน้าปัจจุบัน หน่วยมิลลิวินาที */
  positionMs: number;
  durationMs: number;
  /** ตำแหน่งตัวอักษรที่กำลังอ่าน ใช้ไฮไลต์ตามเสียง */
  charIndex: number;
  /** อ่านจบทั้งเรื่องแล้ว */
  finished: boolean;
  engine: NarratorEngine;
  error?: string;
};

export type NarratorControls = {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  /** ข้ามไปข้างหน้าหรือถอยหลังเป็นมิลลิวินาที ค่าติดลบคือถอยหลัง */
  skip: (deltaMs: number) => void;
  goToPage: (index: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  stop: () => void;
};

export type Narrator = NarratorState & NarratorControls;
