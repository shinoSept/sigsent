import { useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import { useSettings } from '@/store/settings';

/** อ่านข้อความให้ screen reader ทันที (คิวของระบบ ไม่ใช่ TTS ของแอป) */
export function announce(message: string) {
  if (Platform.OS === 'web') return;
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * ประกาศชื่อหน้าจอเมื่อเปิดหน้าใหม่
 * ช่วยให้เด็กที่มองไม่เห็นรู้ว่าตัวเองอยู่หน้าไหนโดยไม่ต้องกวาดนิ้วหาหัวข้อ
 */
export function useScreenAnnouncement(title: string, extra?: string) {
  const enabled = useSettings((s) => s.announceScreens);

  useEffect(() => {
    if (!enabled) return;
    // หน่วงเล็กน้อยให้ทรานซิชันของหน้าจบก่อน ไม่งั้นระบบจะกลืนข้อความ
    const id = setTimeout(() => {
      announce(extra ? `${title}. ${extra}` : title);
    }, 450);
    return () => clearTimeout(id);
  }, [title, extra, enabled]);
}
