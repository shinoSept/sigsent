import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { A11yPressable } from '@/components/A11yPressable';
import { Icon, type IconName } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useT } from '@/i18n';
import { api } from '@/services/api';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/useTheme';
import { announce } from '@/utils/announce';

export default function AddTaleScreen() {
  const theme = useTheme();
  const t = useT();
  const readingLang = useSettings((s) => s.readingLang);
  const [busy, setBusy] = useState(false);

  const pickFile = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      const job = await api.ingestFile(
        {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? 'application/octet-stream',
        },
        readingLang
      );
      router.replace(`/add/processing?jobId=${encodeURIComponent(job.id)}`);
    } catch {
      announce(t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={t('add.title')} showBack announcement={t('add.footnote')}>
      <View style={[styles.grid, { gap: theme.space.lg }]}>
        <AddOption
          icon="camera"
          label={t('add.photo')}
          hint={t('add.photoHint')}
          tone="primary"
          onPress={() => router.push('/add/camera?mode=single')}
        />
        <AddOption
          icon="scan"
          label={t('add.scan')}
          hint={t('add.scanHint')}
          tone="secondary"
          onPress={() => router.push('/add/camera?mode=multi')}
        />
        <AddOption
          icon="upload"
          label={t('add.upload')}
          hint={t('add.uploadHint')}
          tone="secondary"
          onPress={() => void pickFile()}
          disabled={busy}
        />
        <AddOption
          icon="type"
          label={t('add.type')}
          hint={t('add.typeHint')}
          tone="primary"
          onPress={() => router.push('/add/text')}
        />
      </View>

      <Text variant="caption" color={theme.colors.textMuted} center>
        {t('add.footnote')}
      </Text>
    </Screen>
  );
}

/**
 * การ์ดสี่เหลี่ยมจัตุรัสสองคอลัมน์ตามที่ออกแบบไว้
 * ขนาดขั้นต่ำ 150dp เพื่อให้หาเจอด้วยการคลำและกดพลาดยาก
 */
function AddOption({
  icon,
  label,
  hint,
  tone,
  onPress,
  disabled,
}: {
  icon: IconName;
  label: string;
  hint: string;
  tone: 'primary' | 'secondary';
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const bg = tone === 'primary' ? theme.colors.primary : theme.colors.secondary;
  const fg = tone === 'primary' ? theme.colors.onPrimary : theme.colors.onSecondary;

  return (
    <A11yPressable
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      disabled={disabled}
      minSize={150}
      style={[
        styles.option,
        {
          backgroundColor: bg,
          borderRadius: theme.radius.lg,
          padding: theme.space.lg,
          borderWidth: theme.isHighContrast ? 2 : 0,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.optionInner}>
        <Icon name={icon} size={48} color={fg} />
        <Text variant="heading" bold color={fg} center>
          {label}
        </Text>
      </View>
    </A11yPressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  option: {
    // สองคอลัมน์ เว้นช่องกลางไว้ 16
    width: '47%',
    minHeight: 150,
  },
  optionInner: { alignItems: 'center', justifyContent: 'center', gap: 12 },
});
