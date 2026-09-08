import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { api } from '@/services/api';
import type { Tale } from '@/services/api/types';

/** ความคืบหน้าของการฟังนิทานหนึ่งเรื่อง */
export type TaleProgress = {
  pageIndex: number;
  positionMs: number;
  updatedAt: number;
};

type LibraryState = {
  tales: Tale[];
  loading: boolean;
  error?: string;
  /** เก็บความคืบหน้าไว้ในเครื่อง เพื่อให้ปุ่ม "อ่านต่อ" ทำงานได้แม้ปิดแอปไปแล้ว */
  progress: Record<string, TaleProgress>;
  /** เรื่องที่ฟังล่าสุด ใช้แสดงบนหน้าแรก */
  lastTaleId?: string;

  refresh: () => Promise<void>;
  removeTale: (taleId: string) => Promise<void>;
  saveProgress: (taleId: string, pageIndex: number, positionMs: number) => void;
  clearProgress: (taleId: string) => void;
  /** สุ่มหนึ่งเรื่อง เลี่ยงเรื่องที่เพิ่งฟังไปถ้ามีตัวเลือกอื่น */
  pickRandom: () => Tale | undefined;
};

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      tales: [],
      loading: false,
      progress: {},

      refresh: async () => {
        set({ loading: true, error: undefined });
        try {
          const tales = await api.listTales();
          set({ tales, loading: false });
        } catch (err) {
          set({
            loading: false,
            error: err instanceof Error ? err.message : 'โหลดคลังนิทานไม่สำเร็จ',
          });
        }
      },

      removeTale: async (taleId) => {
        // ลบออกจากหน้าจอทันทีเพื่อให้ตอบสนองไว แล้วค่อยยืนยันกับเซิร์ฟเวอร์
        const previous = get().tales;
        set({ tales: previous.filter((t) => t.id !== taleId) });
        try {
          await api.deleteTale(taleId);
          const { [taleId]: _removed, ...rest } = get().progress;
          set({
            progress: rest,
            lastTaleId: get().lastTaleId === taleId ? undefined : get().lastTaleId,
          });
        } catch {
          // ลบไม่สำเร็จให้เอากลับมาแสดงเหมือนเดิม ผู้ใช้จะได้ไม่เข้าใจผิดว่าหายไปแล้ว
          set({ tales: previous, error: 'ลบนิทานไม่สำเร็จ' });
        }
      },

      saveProgress: (taleId, pageIndex, positionMs) => {
        set((state) => ({
          lastTaleId: taleId,
          progress: {
            ...state.progress,
            [taleId]: { pageIndex, positionMs, updatedAt: Date.now() },
          },
        }));
      },

      clearProgress: (taleId) => {
        set((state) => {
          const { [taleId]: _removed, ...rest } = state.progress;
          return { progress: rest };
        });
      },

      pickRandom: () => {
        const { tales, lastTaleId } = get();
        if (tales.length === 0) return undefined;
        const pool = tales.length > 1 ? tales.filter((t) => t.id !== lastTaleId) : tales;
        return pool[Math.floor(Math.random() * pool.length)];
      },
    }),
    {
      name: 'sigsent-library',
      storage: createJSONStorage(() => AsyncStorage),
      // เก็บเฉพาะสิ่งที่เป็นของผู้ใช้จริง ๆ รายการนิทานให้ดึงใหม่ทุกครั้งที่เปิดแอป
      partialize: (state) => ({ progress: state.progress, lastTaleId: state.lastTaleId }),
    }
  )
);
