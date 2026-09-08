import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DEVICE_TTS_LOCALE, type LangCode } from '@/i18n/langs';
import type { Narrator, NarratorEngine, NarratorPage } from './types';

/**
 * ตัวเล่นเสียงอ่านนิทาน
 *
 * รองรับสองแหล่งเสียงหลังหน้ากากเดียวกัน หน้าจอไม่ต้องรู้ว่าใช้ตัวไหน
 *   remote  ไฟล์เสียงจาก backend เป็นทางหลัก และเป็นทางเดียวที่อ่านปกาเกอะญอได้
 *   device  เสียงสังเคราะห์ในเครื่อง ใช้เมื่อยังไม่มีไฟล์เสียง (ตอนใช้ข้อมูลจำลอง
 *           หรือตอนเซิร์ฟเวอร์ล่ม) ทำให้แอปยังสาธิตและใช้งานได้เสมอ
 *
 * เลือกอัตโนมัติจากว่าหน้านั้นมี audioUrl หรือไม่ ไม่ต้องตั้งค่าอะไรเพิ่ม
 */

const TICK_MS = 100;

type Options = {
  /** ความเร็วอ่าน 0.5 ถึง 2.0 */
  rate: number;
  lang: LangCode;
  /** เรียกเมื่อเปลี่ยนหน้า ใช้เลื่อนภาพและประกาศให้ screen reader */
  onPageChange?: (index: number) => void;
  /** เรียกเมื่ออ่านจบทั้งเรื่อง */
  onFinished?: () => void;
};

export function useNarrator(pages: NarratorPage[], opts: Options): Narrator {
  const { rate, lang, onPageChange, onFinished } = opts;

  const [pageIndex, setPageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | undefined>();

  /** ตำแหน่งเวลาของเครื่องมือเสียงในเครื่อง (ตัวเล่นไฟล์เสียงมีตัวนับของมันเอง) */
  const [devicePositionMs, setDevicePositionMs] = useState(0);

  const page = pages[pageIndex];
  const engine: NarratorEngine = page?.audioUrl ? 'remote' : 'device';

  // เปิดเสียงแม้เครื่องอยู่โหมดเงียบ เด็กมักไม่รู้ว่าสวิตช์ข้างเครื่องถูกปิดอยู่
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {
      // ตั้งค่าไม่สำเร็จไม่ควรทำให้ทั้งหน้าพัง แค่เสียงอาจไม่ดังในโหมดเงียบ
    });
  }, []);

  // ---------------------------------------------------------------- ไฟล์เสียง
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  // โหลดไฟล์เสียงของหน้าปัจจุบัน
  useEffect(() => {
    if (engine !== 'remote' || !page?.audioUrl) return;
    try {
      player.replace({ uri: page.audioUrl });
    } catch {
      setError('เปิดไฟล์เสียงไม่สำเร็จ');
    }
  }, [engine, page?.audioUrl, player]);

  useEffect(() => {
    if (engine !== 'remote') return;
    player.playbackRate = clampRate(rate);
  }, [engine, rate, player, page?.audioUrl]);

  // ---------------------------------------------------------- เสียงในเครื่อง
  /** ตำแหน่งตัวอักษรที่เริ่มพูดรอบนี้ ใช้ทำ resume บน Android ที่ไม่มี pause จริง */
  const speakStartCharRef = useRef(0);
  const speakStartTimeRef = useRef(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTicker = useCallback(() => {
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  }, []);

  /** ความยาวโดยประมาณของหน้าปัจจุบันเมื่ออ่านด้วยความเร็วที่ตั้งไว้ */
  const deviceDurationMs = useMemo(() => {
    if (!page) return 0;
    return Math.max(1000, Math.round(page.durationMs / clampRate(rate)));
  }, [page, rate]);

  const speakFrom = useCallback(
    (charOffset: number) => {
      if (!page) return;
      const remaining = page.text.slice(charOffset);
      if (!remaining) return;

      speakStartCharRef.current = charOffset;
      speakStartTimeRef.current = Date.now();

      Speech.speak(remaining, {
        language: DEVICE_TTS_LOCALE[lang],
        rate: clampRate(rate),
        onDone: () => {
          clearTicker();
          setDevicePositionMs(deviceDurationMs);
          advancePage();
        },
        onError: () => {
          clearTicker();
          setIsPlaying(false);
          setError('อ่านออกเสียงไม่สำเร็จ');
        },
      });

      clearTicker();
      tickerRef.current = setInterval(() => {
        const elapsed = Date.now() - speakStartTimeRef.current;
        const base = (speakStartCharRef.current / Math.max(1, page.text.length)) * deviceDurationMs;
        setDevicePositionMs(Math.min(deviceDurationMs, base + elapsed));
      }, TICK_MS);
    },
    // advancePage ถูกประกาศด้านล่าง จึงอ้างผ่าน ref เพื่อเลี่ยงลูปของ dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, lang, rate, deviceDurationMs, clearTicker]
  );

  // -------------------------------------------------------------- การควบคุม
  const advancePageRef = useRef<() => void>(() => {});

  const advancePage = useCallback(() => {
    advancePageRef.current();
  }, []);

  useEffect(() => {
    advancePageRef.current = () => {
      const next = pageIndex + 1;
      if (next < pages.length) {
        setPageIndex(next);
        setDevicePositionMs(0);
        onPageChange?.(next);
        // ยังอยู่ในสถานะเล่น ให้ต่อหน้าถัดไปเองโดยไม่ต้องกดซ้ำ
      } else {
        setIsPlaying(false);
        setFinished(true);
        onFinished?.();
      }
    };
  }, [pageIndex, pages.length, onPageChange, onFinished]);

  const play = useCallback(() => {
    if (!page) return;
    setFinished(false);
    setError(undefined);
    setIsPlaying(true);
    if (engine === 'remote') {
      player.play();
    } else {
      const startChar = Math.round(
        (devicePositionMs / Math.max(1, deviceDurationMs)) * page.text.length
      );
      speakFrom(Math.min(startChar, Math.max(0, page.text.length - 1)));
    }
  }, [page, engine, player, devicePositionMs, deviceDurationMs, speakFrom]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (engine === 'remote') {
      player.pause();
    } else {
      // Speech.pause() ใช้ได้เฉพาะ iOS จึงหยุดแล้วจำตำแหน่งไว้
      // ตอนกดเล่นต่อจะพูดจากตัวอักษรถัดไปเอง วิธีนี้ทำงานเหมือนกันทุกแพลตฟอร์ม
      Speech.stop();
      clearTicker();
    }
  }, [engine, player, clearTicker]);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const positionMs = engine === 'remote' ? Math.round((status?.currentTime ?? 0) * 1000) : devicePositionMs;
  const durationMs =
    engine === 'remote'
      ? Math.round((status?.duration ?? 0) * 1000) || (page?.durationMs ?? 0)
      : deviceDurationMs;

  const seekTo = useCallback(
    (ms: number) => {
      if (!page) return;
      const target = Math.max(0, Math.min(durationMs, ms));
      if (engine === 'remote') {
        void player.seekTo(target / 1000);
      } else {
        setDevicePositionMs(target);
        if (isPlaying) {
          Speech.stop();
          const startChar = Math.round((target / Math.max(1, deviceDurationMs)) * page.text.length);
          speakFrom(Math.min(startChar, Math.max(0, page.text.length - 1)));
        }
      }
    },
    [page, engine, player, durationMs, deviceDurationMs, isPlaying, speakFrom]
  );

  const skip = useCallback(
    (deltaMs: number) => {
      seekTo(positionMs + deltaMs);
    },
    [seekTo, positionMs]
  );

  const stop = useCallback(() => {
    setIsPlaying(false);
    setDevicePositionMs(0);
    if (engine === 'remote') {
      player.pause();
      void player.seekTo(0);
    } else {
      Speech.stop();
      clearTicker();
    }
  }, [engine, player, clearTicker]);

  const goToPage = useCallback(
    (index: number) => {
      const target = Math.max(0, Math.min(pages.length - 1, index));
      if (target === pageIndex) return;
      Speech.stop();
      clearTicker();
      setDevicePositionMs(0);
      setFinished(false);
      setPageIndex(target);
      onPageChange?.(target);
    },
    [pages.length, pageIndex, clearTicker, onPageChange]
  );

  const nextPage = useCallback(() => goToPage(pageIndex + 1), [goToPage, pageIndex]);
  const prevPage = useCallback(() => goToPage(pageIndex - 1), [goToPage, pageIndex]);

  // เล่นหน้าถัดไปต่อเนื่องเมื่อยังอยู่ในสถานะเล่นอยู่
  const prevPageIndexRef = useRef(pageIndex);
  useEffect(() => {
    if (prevPageIndexRef.current === pageIndex) return;
    prevPageIndexRef.current = pageIndex;
    if (!isPlaying) return;

    if (engine === 'device') {
      speakFrom(0);
    } else {
      player.play();
    }
    // ตั้งใจไม่ใส่ speakFrom เพื่อไม่ให้เอฟเฟกต์นี้ทำงานซ้ำตอนความเร็วเปลี่ยน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, isPlaying, engine]);

  // จบไฟล์เสียงของหน้านี้แล้วไปหน้าถัดไป
  useEffect(() => {
    if (engine !== 'remote') return;
    if (status?.didJustFinish) advancePage();
  }, [engine, status?.didJustFinish, advancePage]);

  // หยุดเสียงทุกอย่างเมื่อออกจากหน้าจอ ไม่งั้นเสียงจะค้างเล่นต่อในหน้าอื่น
  useEffect(() => {
    return () => {
      Speech.stop();
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, []);

  /** ตำแหน่งตัวอักษรสำหรับไฮไลต์ตามเสียง */
  const charIndex = useMemo(() => {
    if (!page || durationMs <= 0) return 0;
    const ratio = Math.max(0, Math.min(1, positionMs / durationMs));
    return Math.round(ratio * page.text.length);
  }, [page, positionMs, durationMs]);

  return {
    isPlaying,
    isLoading: engine === 'remote' ? !(status?.isLoaded ?? false) : false,
    pageIndex,
    positionMs,
    durationMs,
    charIndex,
    finished,
    engine,
    error,
    play,
    pause,
    toggle,
    skip,
    goToPage,
    nextPage,
    prevPage,
    stop,
  };
}

/** ทั้ง iOS และ Android รับความเร็วได้ถึง 2 เท่า เกินกว่านั้นเสียงจะเพี้ยน */
function clampRate(rate: number): number {
  return Math.max(0.5, Math.min(2, rate));
}
