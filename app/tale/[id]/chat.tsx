import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { A11yPressable } from '@/components/A11yPressable';
import { ChatBubble } from '@/components/ChatBubble';
import { Icon } from '@/components/Icon';
import { MicButton } from '@/components/MicButton';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useSpeaker } from '@/audio/useSpeaker';
import { useT } from '@/i18n';
import { api } from '@/services/api';
import type { ChatMessage, TaleDetail } from '@/services/api/types';
import { useSettings } from '@/store/settings';
import { fontForText } from '@/theme/fontForText';
import { useTheme } from '@/theme/useTheme';
import { announce } from '@/utils/announce';

export default function TaleChatScreen() {
  const theme = useTheme();
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();

  const readingLang = useSettings((s) => s.readingLang);
  const speechRate = useSettings((s) => s.speechRate);
  const autoPlayAnswers = useSettings((s) => s.autoPlayAnswers);

  const { speak } = useSpeaker(readingLang, speechRate);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [tale, setTale] = useState<TaleDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api
      .getTale(id)
      .then((detail) => {
        if (!cancelled) {
          setTale(detail);
          setSuggestions([t('chat.suggestNext'), t('chat.suggestAgain')]);
        }
      })
      .catch(() => {
        if (!cancelled) announce(t('common.error'));
      });
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !id || thinking) return;

      const question: ChatMessage = {
        id: `local-${Date.now()}`,
        role: 'child',
        text: trimmed,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, question]);
      setDraft('');
      setThinking(true);
      announce(t('chat.thinking'));

      try {
        const reply = await api.chat(id, {
          message: trimmed,
          // ถามจากหน้าที่กำลังฟังอยู่ ตอนนี้ยังไม่ได้ผูกกับตัวเล่นเสียงจึงใช้หน้าแรกไปก่อน
          pageIndex: 0,
          lang: readingLang,
        });
        setMessages((prev) => [...prev, reply.message]);
        setSuggestions(reply.suggestions);
        if (autoPlayAnswers) speak(reply.message.text, reply.message.audioUrl);
      } catch {
        announce(t('common.error'));
      } finally {
        setThinking(false);
      }
    },
    [id, thinking, readingLang, autoPlayAnswers, speak, t]
  );

  const startRecording = useCallback(async () => {
    if (transcribing || recording) return;
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        announce(t('chat.micPermission'));
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
      announce(t('chat.listening'));
    } catch {
      setRecording(false);
      announce(t('common.error'));
    }
  }, [recorder, transcribing, recording, t]);

  const stopRecording = useCallback(async () => {
    if (!recording) return;
    setRecording(false);
    setTranscribing(true);
    announce(t('chat.transcribing'));
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) return;
      const { text } = await api.transcribe(uri, readingLang);
      await send(text);
    } catch {
      announce(t('common.error'));
    } finally {
      setTranscribing(false);
    }
  }, [recorder, recording, readingLang, send, t]);

  const title = tale ? t('chat.titleWithTale', { title: tale.title }) : t('chat.title');

  return (
    <Screen title={title} showBack scroll={false} announcement={t('chat.empty')}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.md }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <Text variant="body" color={theme.colors.textMuted} center>
              {t('chat.empty')}
            </Text>
          ) : (
            messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                onReplay={
                  message.role === 'assistant'
                    ? () => speak(message.text, message.audioUrl)
                    : undefined
                }
              />
            ))
          )}

          {thinking ? (
            <Text
              variant="caption"
              color={theme.colors.textMuted}
              accessibilityLiveRegion="polite"
            >
              {t('chat.thinking')}
            </Text>
          ) : null}
        </ScrollView>

        {/* ชิปคำถามแนะนำ ช่วยเด็กที่ยังนึกไม่ออกว่าจะถามอะไร และเร็วกว่าการพิมพ์ */}
        {suggestions.length > 0 ? (
          <View
            style={[styles.chips, { paddingHorizontal: theme.space.lg, gap: theme.space.sm }]}
            accessibilityLabel={t('chat.suggestions')}
          >
            {suggestions.map((suggestion) => (
              <A11yPressable
                key={suggestion}
                accessibilityLabel={suggestion}
                accessibilityHint={t('chat.send')}
                onPress={() => void send(suggestion)}
                disabled={thinking}
                minSize={56}
                style={[
                  styles.chip,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderRadius: theme.radius.pill,
                    borderWidth: 2,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text variant="label" bold center>
                  {suggestion}
                </Text>
              </A11yPressable>
            ))}
          </View>
        ) : null}

        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              padding: theme.space.lg,
              gap: theme.space.md,
            },
          ]}
        >
          <MicButton
            recording={recording}
            busy={transcribing || thinking}
            onStart={() => void startRecording()}
            onStop={() => void stopRecording()}
          />

          <View style={[styles.inputRow, { gap: theme.space.sm }]}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t('chat.inputPlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              accessibilityLabel={t('chat.inputPlaceholder')}
              allowFontScaling={false}
              onSubmitEditing={() => void send(draft)}
              style={[
                theme.type('body'),
                styles.input,
                {
                  backgroundColor: theme.colors.bg,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                  paddingHorizontal: theme.space.lg,
                  fontFamily: fontForText(draft || t('chat.inputPlaceholder')),
                },
              ]}
            />
            <A11yPressable
              accessibilityLabel={t('chat.send')}
              onPress={() => void send(draft)}
              disabled={!draft.trim() || thinking}
              haptic="success"
              style={[
                styles.send,
                { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md },
              ]}
            >
              <Icon name="send" size={26} color={theme.colors.onPrimary} />
            </A11yPressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingHorizontal: 18, justifyContent: 'center' },
  footer: { borderTopWidth: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, minHeight: 64, borderWidth: 2 },
  send: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
});
