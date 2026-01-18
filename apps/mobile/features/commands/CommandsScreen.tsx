import { View, StyleSheet, ScrollView } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { VoiceInput } from '../../components'
import { useParseCommand, useExecuteCommand } from './hooks'
import type { CommandAction } from './types'
import { useTheme } from '../../lib/theme'
import { Text, Button } from '../../components/ui'

type ProcessingState = 'idle' | 'processing' | 'confirming' | 'executing'

export function CommandsScreen() {
  const { colors, spacing, radius } = useTheme()
  const [processingState, setProcessingState] =
    useState<ProcessingState>('idle')
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
          setError(
            message || 'No actions found in your command. Please try again.'
          )
          setProcessingState('idle')
        } else {
          setPendingActions(actions)
          setProcessingState('confirming')
        }
      },
      onError: (err) => {
        setProcessingState('idle')
        setError(
          err instanceof Error ? err.message : 'Failed to process command'
        )
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
        setError(
          err instanceof Error ? err.message : 'Failed to execute command'
        )
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
      <View
        style={[
          styles.container,
          { backgroundColor: colors.surface.background },
        ]}
      >
        <ScrollView
          style={[styles.confirmationContainer, { padding: spacing.lg }]}
        >
          <Text variant="title.medium" style={{ marginBottom: spacing.lg }}>
            Confirm Actions
          </Text>

          {pendingActions.map((action, index) => (
            <View
              key={index}
              style={[
                styles.actionItem,
                {
                  padding: spacing.md,
                  backgroundColor: colors.surface.grouped,
                  borderRadius: radius.sm,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={colors.feedback.success}
              />
              <Text
                variant="body.primary"
                style={{ marginLeft: spacing.sm, flex: 1 }}
              >
                {formatAction(action)}
              </Text>
            </View>
          ))}

          {error && (
            <View
              style={[
                styles.feedbackContainer,
                {
                  backgroundColor: colors.surface.grouped,
                  padding: spacing.md,
                  borderRadius: radius.lg,
                  marginTop: spacing.lg,
                },
              ]}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color={colors.text.secondary}
                style={{ marginRight: spacing.sm, marginTop: 2 }}
              />
              <Text
                variant="body.secondary"
                color="secondary"
                style={{ flex: 1, lineHeight: 22 }}
              >
                {error}
              </Text>
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.buttonContainer,
            {
              padding: spacing.lg,
              gap: spacing.sm,
              borderTopColor: colors.border.subtle,
            },
          ]}
        >
          <Button
            variant="secondary"
            title="Cancel"
            onPress={handleCancel}
            disabled={isExecuting}
            style={styles.buttonFlex}
          />
          <Button
            title={isExecuting ? 'Confirming...' : 'Confirm'}
            onPress={handleConfirm}
            disabled={isExecuting}
            style={styles.buttonFlex}
          />
        </View>
      </View>
    )
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface.background }]}
    >
      <View style={[styles.content, { paddingHorizontal: spacing.lg }]}>
        <VoiceInput
          onTranscriptReceived={handleTranscriptReceived}
          onError={handleVoiceError}
          isProcessing={processingState === 'processing'}
          statusTextProcessing="Processing command..."
        />

        {error && (
          <View
            style={[
              styles.feedbackContainer,
              {
                backgroundColor: colors.surface.grouped,
                padding: spacing.md,
                borderRadius: radius.lg,
                marginTop: spacing.lg,
              },
            ]}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color={colors.text.secondary}
              style={{ marginRight: spacing.sm, marginTop: 2 }}
            />
            <Text
              variant="body.secondary"
              color="secondary"
              style={{ flex: 1, lineHeight: 22 }}
            >
              {error}
            </Text>
          </View>
        )}

        <View style={[styles.helpContainer, { marginTop: spacing['2xl'] }]}>
          <Text
            variant="body.primary"
            color="secondary"
            style={{ marginBottom: spacing.sm, fontWeight: '600' }}
          >
            Try saying:
          </Text>
          <Text
            variant="body.secondary"
            color="tertiary"
            style={{ marginBottom: spacing.sm }}
          >
            "Add apples to my pantry"
          </Text>
          <Text
            variant="body.secondary"
            color="tertiary"
            style={{ marginBottom: spacing.sm }}
          >
            "Mark milk as running low"
          </Text>
          <Text variant="body.secondary" color="tertiary">
            "Remove eggs from shopping list"
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  helpContainer: {
    alignItems: 'center',
  },
  confirmationContainer: {
    flex: 1,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  buttonFlex: {
    flex: 1,
  },
})
