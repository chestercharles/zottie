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
import { useState, useLayoutEffect, useCallback, useEffect, useRef } from 'react'
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition'
import { useUpdateGoto, useDeleteGoto } from './hooks'
import { Text, Button } from '@/components'
import { useTheme } from '@/lib/theme'

type VoiceState = 'idle' | 'recording'

export function GotoDetailScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const params = useLocalSearchParams<{
    id: string
    name: string
    needs: string
    createdBy: string
    createdAt: string
    updatedAt: string
  }>()
  const { colors, spacing, radius, typography } = useTheme()

  const [name, setName] = useState(params.name ?? '')
  const [needs, setNeeds] = useState(params.needs ?? '')
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')

  const updateGoto = useUpdateGoto()
  const deleteGoto = useDeleteGoto()

  const hasChanges =
    name !== params.name || needs !== params.needs

  const canSave = name.trim().length > 0 && needs.trim().length > 0 && hasChanges

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

    updateGoto.mutate(
      { gotoId: params.id, name: name.trim(), needs: needs.trim() },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          router.back()
        },
      }
    )
  }, [canSave, updateGoto, params.id, name, needs, router])

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Go-to',
      `Are you sure you want to delete "${params.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteGoto.mutate(params.id, {
              onSuccess: () => {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                )
                router.back()
              },
            })
          },
        },
      ]
    )
  }, [deleteGoto, params.id, params.name, router])

  useLayoutEffect(() => {
    navigation.setOptions({
      title: params.name,
      headerRight: () =>
        updateGoto.isPending ? (
          <ActivityIndicator color={colors.action.primary} />
        ) : (
          <TouchableOpacity
            onPress={handleSave}
            hitSlop={8}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityLabel="Save changes"
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
  }, [navigation, params.name, handleSave, canSave, updateGoto.isPending, colors])

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
          editable={!updateGoto.isPending}
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
            disabled={updateGoto.isPending}
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
            marginBottom: spacing.xl,
            color: colors.text.primary,
            backgroundColor: colors.surface.grouped,
            minHeight: 120,
            textAlignVertical: 'top',
          }}
          value={needs}
          onChangeText={setNeeds}
          placeholder="e.g., salt pork, pinto beans, lots of butter"
          placeholderTextColor={colors.text.tertiary}
          editable={!updateGoto.isPending}
          multiline
          numberOfLines={5}
        />

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            paddingVertical: spacing.md,
          }}
          onPress={handleDelete}
          disabled={deleteGoto.isPending}
          accessibilityRole="button"
          accessibilityLabel="Delete go-to"
        >
          {deleteGoto.isPending ? (
            <ActivityIndicator color={colors.feedback.error} />
          ) : (
            <>
              <Ionicons
                name="trash-outline"
                size={20}
                color={colors.feedback.error}
              />
              <Text
                variant="body.primary"
                style={{ color: colors.feedback.error }}
              >
                Delete Go-to
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
