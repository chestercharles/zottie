import { View, TouchableOpacity } from 'react-native'
import { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import {
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionModule,
} from 'expo-speech-recognition'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSpring,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../lib/theme'

type RecordingState = 'idle' | 'recording' | 'processing'

interface VoiceInputProps {
  onTranscriptReceived: (transcript: string) => void
  buttonSize?: number
  isProcessing?: boolean
  showStatusText?: boolean
  statusTextIdle?: string
  statusTextRecording?: string
  statusTextProcessing?: string
  contextualStrings?: string[]
  onError?: (error: string) => void
}

export function VoiceInput({
  onTranscriptReceived,
  buttonSize = 160,
  isProcessing = false,
  showStatusText = true,
  statusTextIdle = 'Tap to speak',
  statusTextRecording = 'Tap to stop',
  statusTextProcessing = 'Processing...',
  contextualStrings = [
    'pantry',
    'shopping',
    'in stock',
    'running low',
    'out of stock',
  ],
  onError,
}: VoiceInputProps) {
  const { colors, spacing, typography } = useTheme()
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const scale = useSharedValue(1)
  const processingOpacity = useSharedValue(1)
  const textOpacity = useSharedValue(1)

  useEffect(() => {
    if (isProcessing) {
      setRecordingState('processing')
    } else if (recordingState === 'processing') {
      setRecordingState('idle')
    }
  }, [isProcessing, recordingState])

  useEffect(() => {
    if (recordingState === 'recording') {
      scale.value = withRepeat(
        withSpring(1.08, {
          damping: 3,
          stiffness: 100,
        }),
        -1,
        true
      )
      cancelAnimation(processingOpacity)
      processingOpacity.value = 1
    } else if (recordingState === 'processing') {
      scale.value = withRepeat(
        withSequence(
          withSpring(1.06, {
            damping: 8,
            stiffness: 80,
          }),
          withSpring(1, {
            damping: 8,
            stiffness: 80,
          })
        ),
        -1,
        false
      )
      processingOpacity.value = withRepeat(
        withTiming(0.6, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
      textOpacity.value = withRepeat(
        withTiming(0.5, {
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    } else {
      cancelAnimation(scale)
      cancelAnimation(processingOpacity)
      cancelAnimation(textOpacity)
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      })
      processingOpacity.value = 1
      textOpacity.value = 1
    }
  }, [recordingState, scale, processingOpacity, textOpacity])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: processingOpacity.value,
  }))

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }))

  const playStopFeedback = () => {
    scale.value = withSequence(
      withSpring(0.92, {
        damping: 15,
        stiffness: 300,
      }),
      withSpring(1, {
        damping: 15,
        stiffness: 200,
      })
    )

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch((error) => {
      console.warn('Failed to play haptic feedback:', error)
    })
  }

  useSpeechRecognitionEvent('start', () => {
    setRecordingState('recording')
  })

  useSpeechRecognitionEvent('end', () => {
    if (recordingState === 'recording') {
      playStopFeedback()
      setRecordingState('idle')
    }
  })

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript
    if (transcript && event.isFinal) {
      onTranscriptReceived(transcript)
    }
  })

  useSpeechRecognitionEvent('error', (event) => {
    setRecordingState('idle')
    const errorMessage = `Speech recognition error: ${event.error}`
    if (onError) {
      onError(errorMessage)
    }
  })

  const handleMicPress = async () => {
    if (recordingState === 'recording') {
      try {
        ExpoSpeechRecognitionModule.stop()
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to stop recording'
        if (onError) {
          onError(errorMessage)
        }
      }
      return
    }

    if (recordingState !== 'idle') {
      return
    }

    try {
      const { granted } =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync()
      if (!granted) {
        if (onError) {
          onError('Microphone permission is required')
        }
        return
      }

      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: false,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
        contextualStrings,
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start recording'
      if (onError) {
        onError(errorMessage)
      }
    }
  }

  const getButtonColor = () => {
    switch (recordingState) {
      case 'recording':
        return colors.feedback.error
      case 'processing':
        return colors.feedback.warning
      default:
        return colors.action.primary
    }
  }

  const getStatusText = () => {
    switch (recordingState) {
      case 'recording':
        return statusTextRecording
      case 'processing':
        return statusTextProcessing
      default:
        return statusTextIdle
    }
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: getButtonColor(),
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            shadowColor: colors.surface.overlay,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
          onPress={handleMicPress}
          disabled={recordingState === 'processing'}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            recordingState === 'recording'
              ? 'Stop recording'
              : recordingState === 'processing'
                ? 'Processing speech'
                : 'Start voice input'
          }
          accessibilityHint={
            recordingState === 'idle' ? 'Tap to start speaking' : undefined
          }
        >
          <Ionicons
            name={recordingState === 'idle' ? 'mic-outline' : 'mic'}
            size={buttonSize * 0.5}
            color={colors.text.inverse}
          />
        </TouchableOpacity>
      </Animated.View>

      {showStatusText && (
        <Animated.Text
          style={[
            {
              fontSize: typography.title.small.fontSize,
              fontWeight: typography.title.small.fontWeight,
              color: colors.text.primary,
              marginTop: spacing.xl,
            },
            recordingState === 'processing' && animatedTextStyle,
          ]}
        >
          {getStatusText()}
        </Animated.Text>
      )}
    </View>
  )
}
