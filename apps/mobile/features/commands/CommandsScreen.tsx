import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
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
  cancelAnimation,
} from 'react-native-reanimated'
import { useParseCommand, useExecuteCommand } from './hooks'
import type { CommandAction } from './types'

type RecordingState = 'idle' | 'recording' | 'processing' | 'confirming' | 'executing'

export function CommandsScreen() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [pendingActions, setPendingActions] = useState<CommandAction[]>([])
  const parseCommand = useParseCommand()
  const executeCommand = useExecuteCommand()

  const scale = useSharedValue(1)

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
    } else {
      cancelAnimation(scale)
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      })
    }
  }, [recordingState])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  useSpeechRecognitionEvent('start', () => {
    setRecordingState('recording')
    setError(null)
  })

  useSpeechRecognitionEvent('end', () => {
    if (recordingState === 'recording') {
      setRecordingState('idle')
    }
  })

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript
    if (transcript && event.isFinal) {
      setRecordingState('processing')
      parseCommand.mutate(transcript, {
        onSuccess: (response) => {
          const actions = response.result.actions
          const message = response.result.message
          if (actions.length === 0) {
            setError(
              message || 'No actions found in your command. Please try again.'
            )
            setRecordingState('idle')
          } else {
            setPendingActions(actions)
            setRecordingState('confirming')
          }
        },
        onError: (err) => {
          setRecordingState('idle')
          setError(err instanceof Error ? err.message : 'Failed to process command')
        },
      })
    }
  })

  useSpeechRecognitionEvent('error', (event) => {
    setRecordingState('idle')
    setError(`Speech recognition error: ${event.error}`)
  })

  const handleMicPress = async () => {
    if (recordingState === 'recording') {
      try {
        ExpoSpeechRecognitionModule.stop()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to stop recording')
      }
      return
    }

    if (recordingState !== 'idle') {
      return
    }

    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
      if (!granted) {
        setError('Microphone permission is required')
        return
      }

      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: false,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
        contextualStrings: [
          'pantry',
          'shopping',
          'in stock',
          'running low',
          'out of stock',
        ],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording')
    }
  }

  const handleConfirm = () => {
    setRecordingState('executing')
    setError(null)
    executeCommand.mutate(pendingActions, {
      onSuccess: () => {
        setPendingActions([])
        setRecordingState('idle')
      },
      onError: (err) => {
        setRecordingState('confirming')
        setError(err instanceof Error ? err.message : 'Failed to execute command')
      },
    })
  }

  const handleCancel = () => {
    setPendingActions([])
    setRecordingState('idle')
    setError(null)
  }

  const getMicButtonColor = () => {
    switch (recordingState) {
      case 'recording':
        return '#E74C3C'
      case 'processing':
        return '#F39C12'
      default:
        return '#3498DB'
    }
  }

  const getStatusText = () => {
    switch (recordingState) {
      case 'recording':
        return 'Tap to stop'
      case 'processing':
        return 'Processing command...'
      case 'executing':
        return 'Executing...'
      default:
        return 'Tap to speak'
    }
  }

  const formatAction = (action: CommandAction): string => {
    const statusText = action.status
      ? ` (${action.status.replace('_', ' ')})`
      : ''

    switch (action.type) {
      case 'add_to_pantry':
        return `Add ${action.item} to pantry${statusText}`
      case 'update_pantry_status':
        return `Mark ${action.item} as ${action.status?.replace('_', ' ')}`
      case 'remove_from_shopping_list':
        return `Remove ${action.item} from shopping list`
      default:
        return `${action.type}: ${action.item}`
    }
  }

  if (
    (recordingState === 'confirming' || recordingState === 'executing') &&
    pendingActions.length > 0
  ) {
    const isExecuting = recordingState === 'executing'
    return (
      <View style={styles.container}>
        <ScrollView style={styles.confirmationContainer}>
          <Text style={styles.confirmationTitle}>Confirm Actions</Text>

          {pendingActions.map((action, index) => (
            <View key={index} style={styles.actionItem}>
              <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
              <Text style={styles.actionText}>{formatAction(action)}</Text>
            </View>
          ))}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.confirmButton, styles.cancelButton]}
            onPress={handleCancel}
            disabled={isExecuting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, isExecuting && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            style={[styles.micButton, { backgroundColor: getMicButtonColor() }]}
            onPress={handleMicPress}
            disabled={recordingState !== 'idle' && recordingState !== 'recording'}
            activeOpacity={0.7}
          >
            {recordingState === 'processing' ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <Ionicons
                name={recordingState === 'recording' ? 'mic' : 'mic-outline'}
                size={80}
                color="#fff"
              />
            )}
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.statusText}>{getStatusText()}</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>Try saying:</Text>
          <Text style={styles.helpText}>"Add apples to my pantry"</Text>
          <Text style={styles.helpText}>"Mark milk as running low"</Text>
          <Text style={styles.helpText}>"Remove eggs from shopping list"</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  micButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 32,
  },
  errorContainer: {
    backgroundColor: '#FADBD8',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    width: '100%',
  },
  errorText: {
    color: '#C0392B',
    fontSize: 14,
    textAlign: 'center',
  },
  helpContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  confirmationContainer: {
    flex: 1,
    padding: 24,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 12,
  },
  actionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#27AE60',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
})
