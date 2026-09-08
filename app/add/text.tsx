import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';

import { A11yPressable } from '@/components/A11yPressable';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useT } from '@/i18n';
import { api } from '@/services/api';
import { useSettings } from '@/store/settings';
import { fontForText } from '@/theme/fontForText';
import { useTheme } from '@/theme/useTheme';
import { announce } from '@/utils/announce';

export default function TypeTaleScreen() {
  const theme = useTheme();
  const t = useT();
  const readingLang = useSettings((s) => s.readingLang);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!body.trim()) {
      announce(t('typeText.needText'));
      return;
    }
    setBusy(true);
    try {
      const job = await api.ingestText(body.trim(), title.trim(), readingLang);
      router.replace(`/add/processing?jobId=${encodeURIComponent(job.id)}`);
    } catch {
      announce(t('common.error'));
      setBusy(false);
    }
  };

  /** สไตล์ช่องกรอก เลือกฟอนต์จากอักษรของข้อความที่อยู่ในช่องนั้นจริง ๆ */
  const inputStyle = (content: string) => [
    theme.type('body'),
    styles.input,
    {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.space.lg,
      fontFamily: fontForText(content),
    },
  ];

  return (
    <Screen title={t('typeText.title')} showBack scroll={false}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, padding: theme.space.lg, gap: theme.space.lg }}>
          <View style={{ gap: theme.space.sm }}>
            <Text variant="label" bold nativeID="title-label">
              {t('typeText.titleLabel')}
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('typeText.titlePlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              accessibilityLabel={t('typeText.titleLabel')}
              accessibilityLabelledBy="title-label"
              allowFontScaling={false}
              style={inputStyle(title || t('typeText.titlePlaceholder'))}
            />
          </View>

          <View style={{ gap: theme.space.sm, flex: 1 }}>
            <Text variant="label" bold>
              {t('typeText.bodyLabel')}
            </Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder={t('typeText.bodyPlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              accessibilityLabel={t('typeText.bodyLabel')}
              multiline
              textAlignVertical="top"
              allowFontScaling={false}
              style={[inputStyle(body || t('typeText.bodyPlaceholder')), styles.multiline]}
            />
          </View>

          <A11yPressable
            accessibilityLabel={t('typeText.submit')}
            accessibilityHint={t('add.typeHint')}
            onPress={() => void submit()}
            disabled={busy || !body.trim()}
            haptic="success"
            minSize={theme.touch.large}
            style={[
              styles.submit,
              { backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg },
            ]}
          >
            <Text variant="heading" bold color={theme.colors.onPrimary} center>
              {t('typeText.submit')}
            </Text>
          </A11yPressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  input: { minHeight: 64, borderWidth: 2 },
  multiline: { flex: 1, minHeight: 160 },
  submit: { minHeight: 88, justifyContent: 'center', paddingHorizontal: 24 },
});
