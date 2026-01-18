import { useState, useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../lib/theme'
import { Text } from '../../components/ui'
import { VoiceInput } from '../../components/VoiceInput'
import { useStreamAssistant } from './hooks'

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

export function AssistantScreen() {
  const { colors, spacing, radius } = useTheme()
  const [transcript, setTranscript] = useState<string | null>(null)
  const { response, isStreaming, error, streamMessage, reset } =
    useStreamAssistant()
  const scrollViewRef = useRef<ScrollView>(null)

  const handleTranscriptReceived = (text: string) => {
    setTranscript(text)
    streamMessage(text)
  }

  const handlePromptPress = (promptId: string) => {
    const prompt = CANNED_PROMPTS.find((p) => p.id === promptId)
    if (!prompt) return

    setTranscript(prompt.label)
    streamMessage(prompt.label)
  }

  const handleNewConversation = () => {
    setTranscript(null)
    reset()
  }

  useEffect(() => {
    if (response) {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }
  }, [response])

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

            {!isStreaming && (response || error) && (
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
})
