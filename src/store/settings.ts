import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { FontScaleName, ThemeName } from '@/theme/tokens';
import type { LangCode } from '@/i18n/langs';

export type SettingsState = {
  /** ภาษาของหน้าจอ */
  uiLang: LangCode;
  /** ภาษาที่ใช้อ่านนิทานออกเสียง (แยกจาก UI ได้ เช่น เมนูปกาเกอะญอ แต่ฝึกฟังภาษาไทย) */
  readingLang: LangCode;
  themeName: ThemeName;
  fontScale: FontScaleName;
  /** ความเร็วการอ่าน 0.5–2.0 */
  speechRate: number;
  /** ไอดีเสียงผู้เล่าที่ backend รองรับ */
  voiceId: string;
  hapticsEnabled: boolean;
  /** อ่านชื่อหน้าจอให้ฟังอัตโนมัติเมื่อเปิดหน้าใหม่ */
  announceScreens: boolean;
  /** เล่นเสียงคำตอบในแชตทันทีที่ได้รับ */
  autoPlayAnswers: boolean;
  childName: string;

  setUiLang: (lang: LangCode) => void;
  setReadingLang: (lang: LangCode) => void;
  setThemeName: (name: ThemeName) => void;
  setFontScale: (scale: FontScaleName) => void;
  setSpeechRate: (rate: number) => void;
  setVoiceId: (id: string) => void;
  toggleHaptics: () => void;
  toggleAnnounceScreens: () => void;
  toggleAutoPlayAnswers: () => void;
  setChildName: (name: string) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      uiLang: 'th',
      readingLang: 'th',
      themeName: 'warm',
      fontScale: 'l',
      speechRate: 1,
      voiceId: 'warm',
      hapticsEnabled: true,
      announceScreens: true,
      autoPlayAnswers: true,
      childName: '',

      setUiLang: (uiLang) => set({ uiLang }),
      setReadingLang: (readingLang) => set({ readingLang }),
      setThemeName: (themeName) => set({ themeName }),
      setFontScale: (fontScale) => set({ fontScale }),
      setSpeechRate: (speechRate) => set({ speechRate }),
      setVoiceId: (voiceId) => set({ voiceId }),
      toggleHaptics: () => set((s) => ({ hapticsEnabled: !s.hapticsEnabled })),
      toggleAnnounceScreens: () => set((s) => ({ announceScreens: !s.announceScreens })),
      toggleAutoPlayAnswers: () => set((s) => ({ autoPlayAnswers: !s.autoPlayAnswers })),
      setChildName: (childName) => set({ childName }),
    }),
    {
      name: 'sigsent-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
