import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { A11yPressable } from '@/components/A11yPressable';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useT } from '@/i18n';
import { api } from '@/services/api';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/useTheme';
import { announce } from '@/utils/announce';

/**
 * หน้าถ่ายรูปหน้าหนังสือ
 *
 * โจทย์ที่ยากที่สุดของหน้านี้คือ ผู้ใช้มองไม่เห็นภาพจากกล้อง
 * จึงออกแบบให้ทุกการกระทำมีเสียงยืนยันเสมอ เช่น ถ่ายแล้วกี่หน้า ลบแล้วเหลือกี่หน้า
 * และปุ่มชัตเตอร์กินพื้นที่กว้างเต็มความกว้างจอ เพื่อให้กดโดนแน่นอนโดยไม่ต้องเล็ง
 */
export default function CameraScreen() {
  const theme = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isMulti = mode === 'multi';

  const readingLang = useSettings((s) => s.readingLang);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [shots, setShots] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const capture = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) return;

      const next = [...shots, photo.uri];
      setShots(next);
      announce(t('camera.capturedOne', { number: next.length }));

      // โหมดหน้าเดียวส่งต่อทันที ไม่ต้องให้ผู้ใช้หาปุ่มยืนยันอีกครั้ง
      if (!isMulti) await submit(next);
    } catch {
      announce(t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (uris: string[]) => {
    if (uris.length === 0) {
      announce(t('camera.needOnePage'));
      return;
    }
    setBusy(true);
    try {
      const job = await api.ingestPhotos(uris, readingLang);
      router.replace(`/add/processing?jobId=${encodeURIComponent(job.id)}`);
    } catch {
      announce(t('common.error'));
      setBusy(false);
    }
  };

  const removeLast = () => {
    setShots((prev) => {
      const next = prev.slice(0, -1);
      announce(t('camera.captured', { count: next.length }));
      return next;
    });
  };

  // ยังไม่รู้สถานะสิทธิ์ ไม่ต้องแสดงอะไรเพื่อไม่ให้ screen reader อ่านสองรอบ
  if (!permission) return <Screen title={t('camera.title')} showBack scroll={false}>{null}</Screen>;

  if (!permission.granted) {
    return (
      <Screen title={t('camera.title')} showBack announcement={t('camera.permissionBody')}>
        <View style={{ gap: theme.space.lg }}>
          <Text variant="heading" bold>
            {t('camera.permissionTitle')}
          </Text>
          <Text variant="body" color={theme.colors.textMuted}>
            {t('camera.permissionBody')}
          </Text>
          <A11yPressable
            accessibilityLabel={t('camera.permissionGrant')}
            onPress={() => void requestPermission()}
            minSize={theme.touch.large}
            style={[
              styles.primaryButton,
              { backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg },
            ]}
          >
            <Text variant="heading" bold color={theme.colors.onPrimary} center>
              {t('camera.permissionGrant')}
            </Text>
          </A11yPressable>
          {permission.canAskAgain ? null : (
            <Text variant="caption" color={theme.colors.danger}>
              {t('camera.permissionDenied')}
            </Text>
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      title={t('camera.title')}
      showBack
      scroll={false}
      announcement={isMulti ? t('add.scanHint') : t('add.photoHint')}
    >
      <View style={styles.root}>
        <View
          style={styles.preview}
          // ภาพจากกล้องไม่มีความหมายกับผู้ใช้ที่มองไม่เห็น
          // ปิดไม่ให้ screen reader อ่าน แล้วบอกสถานะผ่านปุ่มและเสียงประกาศแทน
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            onCameraReady={() => setReady(true)}
          />
        </View>

        <View
          style={[
            styles.controls,
            {
              backgroundColor: theme.colors.surface,
              paddingBottom: insets.bottom + theme.space.lg,
              paddingHorizontal: theme.space.lg,
              paddingTop: theme.space.lg,
              gap: theme.space.md,
            },
          ]}
        >
          {isMulti ? (
            <Text
              variant="body"
              bold
              center
              accessibilityLiveRegion="polite"
              accessibilityLabel={t('camera.captured', { count: shots.length })}
            >
              {t('camera.captured', { count: shots.length })}
            </Text>
          ) : null}

          <A11yPressable
            accessibilityLabel={t('camera.shutter')}
            accessibilityHint={t('camera.shutterHint')}
            onPress={() => void capture()}
            disabled={!ready || busy}
            haptic="heavy"
            minSize={theme.touch.hero}
            style={[
              styles.shutter,
              {
                backgroundColor: theme.colors.accent,
                borderRadius: theme.radius.lg,
                borderWidth: theme.isHighContrast ? 3 : 0,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.shutterInner}>
              <Icon name="camera" size={44} color={theme.colors.onAccent} />
              <Text variant="heading" bold color={theme.colors.onAccent}>
                {t('camera.shutter')}
              </Text>
            </View>
          </A11yPressable>

          {isMulti ? (
            <View style={[styles.row, { gap: theme.space.md }]}>
              <A11yPressable
                accessibilityLabel={t('camera.retake')}
                onPress={removeLast}
                disabled={shots.length === 0 || busy}
                haptic="warning"
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderRadius: theme.radius.md,
                    borderWidth: theme.isHighContrast ? 2 : 0,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text variant="label" bold center>
                  {t('camera.retake')}
                </Text>
              </A11yPressable>

              <A11yPressable
                accessibilityLabel={t('camera.finish')}
                accessibilityHint={t('camera.finishHint')}
                onPress={() => void submit(shots)}
                disabled={shots.length === 0 || busy}
                haptic="success"
                style={[
                  styles.secondaryButton,
                  { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md },
                ]}
              >
                <Text variant="label" bold color={theme.colors.onPrimary} center>
                  {t('camera.finish')}
                </Text>
              </A11yPressable>
            </View>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  preview: { flex: 1, overflow: 'hidden' },
  controls: { width: '100%' },
  shutter: { width: '100%', minHeight: 120, justifyContent: 'center' },
  shutterInner: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  row: { flexDirection: 'row' },
  secondaryButton: { flex: 1, minHeight: 64, justifyContent: 'center', paddingHorizontal: 16 },
  primaryButton: { minHeight: 88, justifyContent: 'center', paddingHorizontal: 24 },
});
