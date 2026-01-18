import {
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useState, useLayoutEffect, useCallback } from 'react'
import { useRouter, useNavigation } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition'
import { useCreateGoto } from './hooks'
import { Text } from '@/components'
import { useTheme } from '@/lib/theme'

type VoiceState = 'idle' | 'recording'

export function GotoCreateScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const { colors, spacing, radius, typography } = useTheme()

  const [name, setName] = useState('')
  const [needs, setNeeds] = useState('')
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')

  const createGoto = useCreateGoto()

  const canSave = name.trim().length > 0 && needs.trim().length > 0

  useSpeechRecognitionEvent('result', (event) => {
    if (event.results && event.results.length > 0) {
      const transcript = event.results[0]?.transcript
      if (transcript) {
        setNeeds((prev) => (prev ? prev + ' ' + transcript : transcript))
      }
    }
  })

  useSpeechRecognitionEvent('end', () => {
    setVoiceState('idle')
  })

  useSpeechRecognitionEvent('error', () => {
    setVoiceState('idle')
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  })

  const toggleRecording = useCallback(async () => {
    if (voiceState === 'recording') {
      await ExpoSpeechRecognitionModule.stop()
      setVoiceState('idle')
    } else {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
      if (!result.granted) {
        Alert.alert(
          'Microphone Access',
          'Please enable microphone access in settings to use voice input.'
        )
        return
      }
      setVoiceState('recording')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: false,
        continuous: false,
      })
    }
  }, [voiceState])

  const handleSave = useCallback(() => {
    if (!canSave) return

    createGoto.mutate(
      { name: name.trim(), needs: needs.trim() },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          router.back()
        },
        onError: (error) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          Alert.alert(
            'Could not save',
            error.message || 'Something went wrong. Please try again.'
          )
        },
      }
    )
  }, [canSave, createGoto, name, needs, router])

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'New Go-to',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text variant="body.primary" style={{ color: colors.action.primary }}>
            Cancel
          </Text>
        </TouchableOpacity>
      ),
      headerRight: () =>
        createGoto.isPending ? (
          <ActivityIndicator color={colors.action.primary} />
        ) : (
          <TouchableOpacity
            onPress={handleSave}
            hitSlop={8}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityLabel="Save go-to"
            style={{ opacity: canSave ? 1 : 0.5 }}
          >
            <Ionicons
              name="checkmark"
              size={28}
              color={canSave ? colors.action.primary : colors.action.disabled}
            />
          </TouchableOpacity>
        ),
    })
  }, [navigation, router, handleSave, canSave, createGoto.isPending, colors])

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.surface.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          variant="body.secondary"
          color="secondary"
          style={{ fontWeight: '600', marginBottom: spacing.xs }}
        >
          Name
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: colors.border.subtle,
            borderRadius: radius.sm,
            paddingVertical: spacing.sm + 4,
            paddingHorizontal: spacing.md,
            fontSize: typography.body.primary.fontSize,
            marginBottom: spacing.lg,
            color: colors.text.primary,
            backgroundColor: colors.surface.grouped,
          }}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Pork and Beans"
          placeholderTextColor={colors.text.tertiary}
          editable={!createGoto.isPending}
          autoFocus
        />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.xs,
          }}
        >
          <Text variant="body.secondary" color="secondary" style={{ fontWeight: '600' }}>
            Needs
          </Text>
          <TouchableOpacity
            onPress={toggleRecording}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              voiceState === 'recording' ? 'Stop recording' : 'Add by voice'
            }
            disabled={createGoto.isPending}
          >
            <Ionicons
              name={voiceState === 'recording' ? 'mic' : 'mic-outline'}
              size={22}
              color={
                voiceState === 'recording'
                  ? colors.feedback.error
                  : colors.action.primary
              }
            />
          </TouchableOpacity>
        </View>
        {voiceState === 'recording' && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              marginBottom: spacing.xs,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.feedback.error,
              }}
            />
            <Text variant="caption" color="secondary">
              Listening... tap mic to stop
            </Text>
          </View>
        )}
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: colors.border.subtle,
            borderRadius: radius.sm,
            paddingVertical: spacing.sm + 4,
            paddingHorizontal: spacing.md,
            fontSize: typography.body.primary.fontSize,
            color: colors.text.primary,
            backgroundColor: colors.surface.grouped,
            minHeight: 120,
            textAlignVertical: 'top',
          }}
          value={needs}
          onChangeText={setNeeds}
          placeholder="e.g., salt pork, pinto beans, lots of butter"
          placeholderTextColor={colors.text.tertiary}
          editable={!createGoto.isPending}
          multiline
          numberOfLines={5}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
