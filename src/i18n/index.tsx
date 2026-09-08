import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import { useSettings } from '@/store/settings';
import { ksw } from './ksw';
import { th, type Translations } from './th';
import type { LangCode } from './langs';

/** ทุกคีย์ที่ใช้ได้ เช่น 'home.greeting' — TypeScript จะเตือนถ้าพิมพ์ผิด */
type Join<K, P> = K extends string
  ? P extends string
    ? // P ว่างแปลว่า K เป็นใบสุดท้ายแล้ว จึงไม่ต้องต่อจุดข้างท้าย
      P extends ''
      ? K
      : `${K}.${P}`
    : never
  : never;
type Leaves<T> = T extends object
  ? { [K in keyof T]-?: Join<K, Leaves<T[K]>> }[keyof T]
  : '';
export type TKey = Leaves<Translations>;

const bundles: Record<LangCode, unknown> = { th, ksw };

function lookup(bundle: unknown, path: string[]): string | undefined {
  let node: unknown = bundle;
  for (const key of path) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === 'string' ? node : undefined;
}

/** แทนที่ตัวแปรในรูปแบบ {{name}} */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  );
}

/**
 * หาคำแปล: ลองภาษาที่เลือกก่อน ถ้าไม่มีให้ถอยไปภาษาไทย
 * ถ้าไม่มีทั้งคู่จะคืนคีย์ดิบเพื่อให้เห็นชัดว่าลืมใส่ (แต่ไม่ทำให้แอปพัง)
 */
function resolve(lang: LangCode, key: string, vars?: Record<string, string | number>): string {
  const path = key.split('.');
  const primary = lookup(bundles[lang], path);
  if (primary !== undefined) return interpolate(primary, vars);
  const fallback = lookup(th, path);
  if (fallback !== undefined) return interpolate(fallback, vars);
  if (__DEV__) console.warn(`[i18n] ไม่พบคำแปลของคีย์ "${key}"`);
  return key;
}

export type TFunction = (key: TKey, vars?: Record<string, string | number>) => string;

type I18nValue = {
  lang: LangCode;
  t: TFunction;
  /** แปลข้อความในภาษาใดภาษาหนึ่งโดยไม่สนค่าที่ตั้งไว้ ใช้ตอนอ่านออกเสียง */
  tIn: (lang: LangCode, key: TKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = useSettings((s) => s.uiLang);

  const t = useCallback<TFunction>((key, vars) => resolve(lang, key, vars), [lang]);
  const tIn = useCallback(
    (l: LangCode, key: TKey, vars?: Record<string, string | number>) => resolve(l, key, vars),
    []
  );

  const value = useMemo<I18nValue>(() => ({ lang, t, tIn }), [lang, t, tIn]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n ต้องอยู่ภายใน <I18nProvider>');
  return ctx;
}

/** ทางลัดที่ใช้บ่อยที่สุด */
export function useT(): TFunction {
  return useI18n().t;
}
