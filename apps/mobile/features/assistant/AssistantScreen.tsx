import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from 'react-native-auth0'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../lib/theme'
import { Text } from '../../components/ui'
import { VoiceInput } from '../../components/VoiceInput'
import { useStreamAssistant, type ProposedActions, type ProposedAction } from './hooks'
import { executeAssistantActions } from './api'
import { useAuth } from '../auth'
import { queryKeys } from '../../lib/query/keys'

const CANNED_PROMPTS = [
  {
    id: 'update-pantry',
    label: 'Update pantry items',
    icon: 'refresh-outline' as const,
  },
  {
    id: 'plan-meals',
    label: 'Help me plan meals',
    icon: 'restaurant-outline' as const,
  },
  {
    id: 'add-shopping',
    label: 'Add to shopping list',
    icon: 'cart-outline' as const,
  },
  {
    id: 'whats-available',
    label: "What's in my pantry?",
    icon: 'search-outline' as const,
  },
]

function formatActionDescription(action: ProposedAction): string {
  const statusLabels: Record<string, string> = {
    in_stock: 'in stock',
    running_low: 'running low',
    out_of_stock: 'out of stock',
    planned: 'to shopping list',
  }

  if (action.type === 'add_to_pantry') {
    if (action.status === 'planned' || action.status === 'out_of_stock') {
      return `Add "${action.item}" to shopping list`
    }
    return `Add "${action.item}" to pantry (${statusLabels[action.status]})`
  }

  return `Mark "${action.item}" as ${statusLabels[action.status]}`
}

export function AssistantScreen() {
  const { colors, spacing, radius } = useTheme()
  const [transcript, setTranscript] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const {
    response,
    isStreaming,
    error,
    proposedActions,
    streamMessage,
    reset,
    clearProposedActions,
  } = useStreamAssistant()
  const scrollViewRef = useRef<ScrollView>(null)
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const queryClient = useQueryClient()

  const handleTranscriptReceived = (text: string) => {
    setTranscript(text)
    setExecutionResult(null)
    streamMessage(text)
  }

  const handlePromptPress = (promptId: string) => {
    const prompt = CANNED_PROMPTS.find((p) => p.id === promptId)
    if (!prompt) return

    setTranscript(prompt.label)
    setExecutionResult(null)
    streamMessage(prompt.label)
  }

  const handleNewConversation = () => {
    setTranscript(null)
    setExecutionResult(null)
    reset()
  }

  const handleApproveActions = useCallback(async () => {
    if (!proposedActions || !user?.id) return

    setIsExecuting(true)
    setExecutionResult(null)

    try {
      const credentials = await getCredentials()
      if (!credentials?.accessToken) {
        throw new Error('No access token available')
      }

      const result = await executeAssistantActions(
        proposedActions.actions,
        credentials.accessToken,
        user.id
      )

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      queryClient.invalidateQueries({ queryKey: queryKeys.pantryItems(user.id) })

      const itemCount = result.executed
      setExecutionResult({
        success: true,
        message:
          itemCount === 1
            ? 'Done! 1 item updated.'
            : `Done! ${itemCount} items updated.`,
      })
      clearProposedActions()
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setExecutionResult({
        success: false,
        message:
          err instanceof Error ? err.message : 'Something went wrong',
      })
    } finally {
      setIsExecuting(false)
    }
  }, [proposedActions, user?.id, getCredentials, queryClient, clearProposedActions])

  const handleRejectActions = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    clearProposedActions()
  }, [clearProposedActions])

  useEffect(() => {
    if (response || proposedActions) {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }
  }, [response, proposedActions])

  const showConversation = transcript || response || isStreaming

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface.background }]}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
      >
        {!showConversation && (
          <>
            <VoiceInput
              onTranscriptReceived={handleTranscriptReceived}
              buttonSize={120}
              showStatusText={true}
              statusTextIdle="Tap to speak with your assistant"
              statusTextRecording="Listening..."
              statusTextProcessing="Processing..."
              contextualStrings={[
                'pantry',
                'shopping',
                'in stock',
                'running low',
                'out of stock',
                'groceries',
                'meal',
                'recipe',
              ]}
            />

            <View style={[styles.promptsContainer, { marginTop: spacing['2xl'] }]}>
              <Text
                variant="body.primary"
                color="secondary"
                style={{ marginBottom: spacing.md, fontWeight: '600' }}
              >
                Or try one of these:
              </Text>

              <View style={[styles.promptsGrid, { gap: spacing.sm }]}>
                {CANNED_PROMPTS.map((prompt) => (
                  <TouchableOpacity
                    key={prompt.id}
                    style={[
                      styles.promptButton,
                      {
                        backgroundColor: colors.surface.grouped,
                        padding: spacing.md,
                        borderRadius: radius.md,
                      },
                    ]}
                    onPress={() => handlePromptPress(prompt.id)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={prompt.label}
                  >
                    <Ionicons
                      name={prompt.icon}
                      size={20}
                      color={colors.action.primary}
                      style={{ marginRight: spacing.sm }}
                    />
                    <Text variant="body.primary" style={{ flex: 1 }}>
                      {prompt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {showConversation && (
          <View style={styles.conversationContainer}>
            {transcript && (
              <View
                style={[
                  styles.messageContainer,
                  styles.userMessage,
                  {
                    backgroundColor: colors.action.primary,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                    marginBottom: spacing.md,
                  },
                ]}
              >
                <Text variant="body.primary" style={{ color: colors.text.inverse }}>
                  {transcript}
                </Text>
              </View>
            )}

            {(response || isStreaming) && (
              <View
                style={[
                  styles.messageContainer,
                  styles.assistantMessage,
                  {
                    backgroundColor: colors.surface.grouped,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                  },
                ]}
              >
                {response ? (
                  <Text variant="body.primary">{response}</Text>
                ) : (
                  <View style={styles.streamingIndicator}>
                    <ActivityIndicator
                      size="small"
                      color={colors.text.secondary}
                    />
                    <Text
                      variant="body.secondary"
                      color="secondary"
                      style={{ marginLeft: spacing.sm }}
                    >
                      Thinking...
                    </Text>
                  </View>
                )}
              </View>
            )}

            {error && (
              <View
                style={[
                  styles.errorContainer,
                  {
                    backgroundColor: colors.feedback.error + '15',
                    borderRadius: radius.md,
                    padding: spacing.md,
                    marginTop: spacing.md,
                  },
                ]}
              >
                <Text variant="body.secondary" style={{ color: colors.feedback.error }}>
                  {error}
                </Text>
              </View>
            )}

            {proposedActions && (
              <View
                style={[
                  styles.proposedActionsCard,
                  {
                    backgroundColor: colors.surface.grouped,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                    marginTop: spacing.md,
                  },
                ]}
              >
                <Text
                  variant="body.primary"
                  style={{ fontWeight: '600', marginBottom: spacing.sm }}
                >
                  {proposedActions.summary}
                </Text>

                <View style={[styles.actionsList, { gap: spacing.xs }]}>
                  {proposedActions.actions.map((action, index) => (
                    <View
                      key={`${action.item}-${index}`}
                      style={[styles.actionItem, { gap: spacing.sm }]}
                    >
                      <Ionicons
                        name={
                          action.status === 'out_of_stock' ||
                          action.status === 'planned'
                            ? 'cart-outline'
                            : 'checkmark-circle-outline'
                        }
                        size={16}
                        color={colors.text.secondary}
                      />
                      <Text variant="body.secondary" color="secondary">
                        {formatActionDescription(action)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View
                  style={[
                    styles.actionButtonsRow,
                    { marginTop: spacing.md, gap: spacing.sm },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.rejectButton,
                      {
                        borderColor: colors.border.subtle,
                        borderRadius: radius.md,
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.md,
                      },
                    ]}
                    onPress={handleRejectActions}
                    disabled={isExecuting}
                    activeOpacity={0.7}
                  >
                    <Text variant="body.primary" color="secondary">
                      Not now
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.approveButton,
                      {
                        backgroundColor: colors.action.primary,
                        borderRadius: radius.md,
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.md,
                      },
                    ]}
                    onPress={handleApproveActions}
                    disabled={isExecuting}
                    activeOpacity={0.7}
                  >
                    {isExecuting ? (
                      <ActivityIndicator size="small" color={colors.text.inverse} />
                    ) : (
                      <Text
                        variant="body.primary"
                        style={{ color: colors.text.inverse, fontWeight: '600' }}
                      >
                        Do it
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {executionResult && (
              <View
                style={[
                  styles.resultContainer,
                  {
                    backgroundColor: executionResult.success
                      ? colors.feedback.success + '15'
                      : colors.feedback.error + '15',
                    borderRadius: radius.md,
                    padding: spacing.md,
                    marginTop: spacing.md,
                  },
                ]}
              >
                <Ionicons
                  name={
                    executionResult.success
                      ? 'checkmark-circle-outline'
                      : 'alert-circle-outline'
                  }
                  size={18}
                  color={
                    executionResult.success
                      ? colors.feedback.success
                      : colors.feedback.error
                  }
                  style={{ marginRight: spacing.sm }}
                />
                <Text
                  variant="body.secondary"
                  style={{
                    color: executionResult.success
                      ? colors.feedback.success
                      : colors.feedback.error,
                    flex: 1,
                  }}
                >
                  {executionResult.message}
                </Text>
              </View>
            )}

            {!isStreaming &&
              !proposedActions &&
              (response || error || executionResult) && (
                <View style={[styles.actionsContainer, { marginTop: spacing.xl }]}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: colors.surface.grouped,
                        padding: spacing.md,
                        borderRadius: radius.md,
                      },
                    ]}
                    onPress={handleNewConversation}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={20}
                      color={colors.action.primary}
                      style={{ marginRight: spacing.sm }}
                    />
                    <Text variant="body.primary" color="primary">
                      New conversation
                    </Text>
                  </TouchableOpacity>

                  <VoiceInput
                    onTranscriptReceived={handleTranscriptReceived}
                    buttonSize={56}
                    showStatusText={false}
                    contextualStrings={[
                      'pantry',
                      'shopping',
                      'in stock',
                      'running low',
                      'out of stock',
                    ]}
                  />
                </View>
              )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingTop: 60,
  },
  promptsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  promptsGrid: {
    width: '100%',
  },
  promptButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationContainer: {
    width: '100%',
  },
  messageContainer: {
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  streamingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorContainer: {
    width: '100%',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  proposedActionsCard: {
    width: '100%',
  },
  actionsList: {
    width: '100%',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  rejectButton: {
    borderWidth: 1,
  },
  approveButton: {
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
})
