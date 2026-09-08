import { useAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useCallback, useEffect } from 'react';

import { DEVICE_TTS_LOCALE, type LangCode } from '@/i18n/langs';

/**
 * ตัวพูดข้อความสั้น ๆ ครั้งเดียวจบ ใช้กับคำตอบในหน้าแชต
 *
 * ใช้หลักเดียวกับตัวเล่นนิทาน คือถ้ามีไฟล์เสียงจาก backend ให้เล่นไฟล์
 * ถ้ายังไม่มีก็ใช้เสียงสังเคราะห์ในเครื่อง เพื่อให้เด็กที่อ่านหนังสือไม่ได้
 * ยังได้ยินคำตอบเสมอ ไม่ว่าจะต่อเซิร์ฟเวอร์แล้วหรือยัง
 */
export function useSpeaker(lang: LangCode, rate: number) {
  const player = useAudioPlayer(null);

  const speak = useCallback(
    (text: string, audioUrl?: string) => {
      Speech.stop();
      if (audioUrl) {
        try {
          player.replace({ uri: audioUrl });
          player.playbackRate = Math.max(0.5, Math.min(2, rate));
          player.play();
          return;
        } catch {
          // เล่นไฟล์ไม่ได้ก็ตกไปใช้เสียงในเครื่องแทน ดีกว่าเงียบไปเฉย ๆ
        }
      }
      Speech.speak(text, {
        language: DEVICE_TTS_LOCALE[lang],
        rate: Math.max(0.5, Math.min(2, rate)),
      });
    },
    [player, lang, rate]
  );

  const stop = useCallback(() => {
    Speech.stop();
    player.pause();
  }, [player]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  return { speak, stop };
}
