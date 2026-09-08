import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

/**
 * ไอคอนทั้งหมดของแอปรวมไว้ที่เดียว
 *
 * ตั้งชื่อตามความหมายไม่ใช่ตามหน้าตา เพื่อให้เปลี่ยนชุดไอคอนทีหลังได้จากไฟล์เดียว
 * ไอคอนทุกตัวเป็นของประกอบเท่านั้น ข้อความอธิบายอยู่ที่ accessibilityLabel ของปุ่ม
 */

type IonName = ComponentProps<typeof Ionicons>['name'];
type MaterialName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const IONICONS = {
  back: 'chevron-back',
  forward: 'chevron-forward',
  bell: 'notifications-outline',
  search: 'search',
  camera: 'camera',
  scan: 'scan',
  upload: 'cloud-upload',
  type: 'create',
  home: 'home',
  library: 'grid',
  chat: 'chatbubble-ellipses',
  settings: 'settings',
  play: 'play',
  pause: 'pause',
  mic: 'mic',
  more: 'ellipsis-horizontal',
  trash: 'trash',
  check: 'checkmark',
  close: 'close',
  send: 'send',
  book: 'book',
  add: 'add',
  volume: 'volume-high',
  refresh: 'refresh',
  warning: 'warning',
} satisfies Record<string, IonName>;

const MATERIAL = {
  back10: 'rewind-10',
  forward10: 'fast-forward-10',
  dice: 'dice-5',
  sparkle: 'auto-fix',
  textSize: 'format-size',
  contrast: 'contrast-circle',
  translate: 'translate',
  speed: 'speedometer',
  vibrate: 'vibrate',
} satisfies Record<string, MaterialName>;

export type IconName = keyof typeof IONICONS | keyof typeof MATERIAL;

export type IconProps = {
  name: IconName;
  size?: number;
  color: string;
};

export function Icon({ name, size = 24, color }: IconProps) {
  if (name in IONICONS) {
    return (
      <Ionicons
        name={IONICONS[name as keyof typeof IONICONS]}
        size={size}
        color={color}
        // ไอคอนเป็นของประกอบ ปุ่มที่ห่อมันมี label อยู่แล้ว
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    );
  }
  return (
    <MaterialCommunityIcons
      name={MATERIAL[name as keyof typeof MATERIAL]}
      size={size}
      color={color}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
