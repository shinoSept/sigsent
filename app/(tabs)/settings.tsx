import { StyleSheet, Switch, TextInput, View } from 'react-native';

import { A11yPressable } from '@/components/A11yPressable';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useT, type TKey } from '@/i18n';
import { LANGS, LANG_LABELS, type LangCode } from '@/i18n/langs';
import { USE_MOCK } from '@/services/api';
import { useSettings } from '@/store/settings';
import { fontForText } from '@/theme/fontForText';
import { type FontScaleName, type ThemeName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { announce } from '@/utils/announce';

export default function SettingsScreen() {
  const theme = useTheme();
  const t = useT();
  const s = useSettings();

  return (
    <Screen title={t('settings.title')}>
      {USE_MOCK ? (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: theme.radius.md,
              padding: theme.space.md,
              borderWidth: 2,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text variant="caption">{t('settings.mockBanner')}</Text>
        </View>
      ) : null}

      <Section title={t('settings.sectionLanguage')}>
        <ChoiceRow
          label={t('settings.uiLang')}
          options={LANGS.map((lang) => ({
            value: lang,
            label: LANG_LABELS[lang].native,
            a11yLabel: LANG_LABELS[lang].th,
          }))}
          value={s.uiLang}
          onChange={(lang) => {
            s.setUiLang(lang as LangCode);
            announce(LANG_LABELS[lang as LangCode].th);
          }}
        />
        <ChoiceRow
          label={t('settings.readingLang')}
          options={LANGS.map((lang) => ({
            value: lang,
            label: LANG_LABELS[lang].native,
            a11yLabel: LANG_LABELS[lang].th,
          }))}
          value={s.readingLang}
          onChange={(lang) => s.setReadingLang(lang as LangCode)}
        />
      </Section>

      <Section title={t('settings.sectionDisplay')}>
        <ChoiceRow
          label={t('settings.fontScale')}
          options={(
            [
              ['m', 'settings.fontScaleM'],
              ['l', 'settings.fontScaleL'],
              ['xl', 'settings.fontScaleXl'],
              ['xxl', 'settings.fontScaleXxl'],
            ] as [FontScaleName, TKey][]
          ).map(([value, key]) => ({ value, label: t(key) }))}
          value={s.fontScale}
          onChange={(v) => s.setFontScale(v as FontScaleName)}
        />
        <ChoiceRow
          label={t('settings.theme')}
          options={(
            [
              ['warm', 'settings.themeWarm'],
              ['contrast', 'settings.themeContrast'],
            ] as [ThemeName, TKey][]
          ).map(([value, key]) => ({ value, label: t(key) }))}
          value={s.themeName}
          onChange={(v) => s.setThemeName(v as ThemeName)}
        />
      </Section>

      <Section title={t('settings.sectionAudio')}>
        <ChoiceRow
          label={t('settings.speechRate')}
          options={[0.75, 1, 1.25, 1.5, 2].map((rate) => ({
            value: String(rate),
            label: `${rate}x`,
            a11yLabel: t('reader.speed', { rate }),
          }))}
          value={String(s.speechRate)}
          onChange={(v) => s.setSpeechRate(Number(v))}
        />
        <ChoiceRow
          label={t('settings.voice')}
          options={(['warm', 'child', 'elder'] as const).map((voice) => ({
            value: voice,
            label: t(`voices.${voice}`),
          }))}
          value={s.voiceId}
          onChange={(v) => s.setVoiceId(v)}
        />
        <ToggleRow
          label={t('settings.autoPlayAnswers')}
          value={s.autoPlayAnswers}
          onToggle={s.toggleAutoPlayAnswers}
        />
      </Section>

      <Section title={t('settings.sectionAccessibility')}>
        <ToggleRow label={t('settings.haptics')} value={s.hapticsEnabled} onToggle={s.toggleHaptics} />
        <ToggleRow
          label={t('settings.announceScreens')}
          value={s.announceScreens}
          onToggle={s.toggleAnnounceScreens}
        />
      </Section>

      <Section title={t('settings.sectionAbout')}>
        <NameField />
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space.md }}>
      <Text variant="heading" bold accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

/**
 * แถวเลือกหนึ่งค่าจากหลายตัวเลือก
 * ใช้ปุ่มเรียงกันแทน picker เพราะ screen reader อ่านปุ่มได้ตรงไปตรงมากว่า
 * และเด็กเห็นตัวเลือกทั้งหมดพร้อมกันโดยไม่ต้องเปิดหน้าต่างซ้อน
 */
function ChoiceRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string; a11yLabel?: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.sm }}>
      <Text variant="label" bold>
        {label}
      </Text>
      <View style={[styles.options, { gap: theme.space.sm }]}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <A11yPressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={`${label}. ${option.a11yLabel ?? option.label}`}
              accessibilityState={{ selected, checked: selected }}
              onPress={() => onChange(option.value)}
              minSize={64}
              style={[
                styles.option,
                {
                  backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                  borderRadius: theme.radius.pill,
                  borderWidth: 2,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text
                variant="label"
                bold
                center
                color={selected ? theme.colors.onPrimary : theme.colors.text}
              >
                {option.label}
              </Text>
            </A11yPressable>
          );
        })}
      </View>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  const t = useT();

  return (
    <View
      style={[
        styles.toggle,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          padding: theme.space.lg,
          borderWidth: theme.isHighContrast ? 2 : 0,
          borderColor: theme.colors.border,
        },
      ]}
      accessible
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      accessibilityValue={{ text: value ? t('settings.on') : t('settings.off') }}
    >
      <Text variant="label" style={{ flex: 1 }}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.colors.surfaceAlt, true: theme.colors.primary }}
        thumbColor={theme.colors.surface}
      />
    </View>
  );
}

function NameField() {
  const theme = useTheme();
  const t = useT();
  const childName = useSettings((s) => s.childName);
  const setChildName = useSettings((s) => s.setChildName);

  return (
    <View style={{ gap: theme.space.sm }}>
      <Text variant="label" bold>
        {t('settings.childName')}
      </Text>
      <TextInput
        value={childName}
        onChangeText={setChildName}
        placeholder={t('settings.childNamePlaceholder')}
        placeholderTextColor={theme.colors.textMuted}
        accessibilityLabel={t('settings.childName')}
        allowFontScaling={false}
        style={[
          theme.type('body'),
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.space.lg,
            fontFamily: fontForText(childName || t('settings.childNamePlaceholder')),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { width: '100%' },
  options: { flexDirection: 'row', flexWrap: 'wrap' },
  option: { paddingHorizontal: 20, justifyContent: 'center', minWidth: 72 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { minHeight: 64, borderWidth: 2 },
});
