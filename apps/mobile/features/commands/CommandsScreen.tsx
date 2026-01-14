import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { VoiceInput } from '../../components'
import { useParseCommand, useExecuteCommand } from './hooks'
import type { CommandAction } from './types'

type ProcessingState = 'idle' | 'processing' | 'confirming' | 'executing'

export function CommandsScreen() {
  const [processingState, setProcessingState] = useState<ProcessingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [pendingActions, setPendingActions] = useState<CommandAction[]>([])
  const parseCommand = useParseCommand()
  const executeCommand = useExecuteCommand()

  const handleTranscriptReceived = (transcript: string) => {
    setProcessingState('processing')
    parseCommand.mutate(transcript, {
      onSuccess: (response) => {
        const actions = response.result.actions
        const message = response.result.message
        if (actions.length === 0) {
          setError(message || 'No actions found in your command. Please try again.')
          setProcessingState('idle')
        } else {
          setPendingActions(actions)
          setProcessingState('confirming')
        }
      },
      onError: (err) => {
        setProcessingState('idle')
        setError(err instanceof Error ? err.message : 'Failed to process command')
      },
    })
  }

  const handleVoiceError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const handleConfirm = () => {
    setProcessingState('executing')
    setError(null)
    executeCommand.mutate(pendingActions, {
      onSuccess: () => {
        setPendingActions([])
        setProcessingState('idle')
      },
      onError: (err) => {
        setProcessingState('confirming')
        setError(err instanceof Error ? err.message : 'Failed to execute command')
      },
    })
  }

  const handleCancel = () => {
    setPendingActions([])
    setProcessingState('idle')
    setError(null)
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
    (processingState === 'confirming' || processingState === 'executing') &&
    pendingActions.length > 0
  ) {
    const isExecuting = processingState === 'executing'
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
        <VoiceInput
          onTranscriptReceived={handleTranscriptReceived}
          onError={handleVoiceError}
          isProcessing={processingState === 'processing'}
          statusTextProcessing="Processing command..."
        />

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
