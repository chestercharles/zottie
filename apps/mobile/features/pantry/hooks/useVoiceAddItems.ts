import { useState, useCallback } from 'react'
import {
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionModule,
} from 'expo-speech-recognition'
import * as Haptics from 'expo-haptics'
import { useOnboardingItemParsing } from '@/features/onboarding/hooks'

type VoiceState = 'idle' | 'recording' | 'processing'

export function useVoiceAddItems() {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [error, setError] = useState<string | null>(null)
  const parseItems = useOnboardingItemParsing()

  const processTranscript = useCallback(
    async (transcript: string) => {
      if (!transcript.trim()) {
        setVoiceState('idle')
        return
      }

      setVoiceState('processing')
      setError(null)

      try {
        await parseItems.mutateAsync({
          text: transcript,
          context: 'pantry',
        })
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        setVoiceState('idle')
      } catch (err) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again.'
        )
        setVoiceState('idle')
      }
    },
    [parseItems]
  )

  useSpeechRecognitionEvent('start', () => {
    setVoiceState('recording')
    setError(null)
  })

  useSpeechRecognitionEvent('end', () => {
    if (voiceState === 'recording') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  })

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript
    if (transcript && event.isFinal) {
      processTranscript(transcript)
    }
  })

  useSpeechRecognitionEvent('error', () => {
    setVoiceState('idle')
    setError('Voice recognition failed. Please try again.')
  })

  const startRecording = useCallback(async () => {
    if (voiceState !== 'idle') return

    setError(null)

    try {
      const { granted } =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync()
      if (!granted) {
        setError('Microphone permission is required')
        return
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: false,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
        contextualStrings: ['pantry', 'in stock', 'running low', 'have'],
      })
    } catch {
      setError('Failed to start voice recording')
    }
  }, [voiceState])

  const stopRecording = useCallback(() => {
    if (voiceState !== 'recording') return

    try {
      ExpoSpeechRecognitionModule.stop()
    } catch {
      setVoiceState('idle')
    }
  }, [voiceState])

  const toggleRecording = useCallback(() => {
    if (voiceState === 'recording') {
      stopRecording()
    } else if (voiceState === 'idle') {
      startRecording()
    }
  }, [voiceState, startRecording, stopRecording])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    voiceState,
    error,
    toggleRecording,
    clearError,
    isRecording: voiceState === 'recording',
    isProcessing: voiceState === 'processing',
  }
}
