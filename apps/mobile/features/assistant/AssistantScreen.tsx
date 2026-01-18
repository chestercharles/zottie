import { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../lib/theme'
import { Text } from '../../components/ui'
import { VoiceInput } from '../../components/VoiceInput'

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

  const handleTranscriptReceived = (text: string) => {
    setTranscript(text)
  }

  const handlePromptPress = (_promptId: string) => {
    // Placeholder - prompt handling will be implemented in a future PRD
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
      >
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

        {transcript && (
          <View
            style={[
              styles.transcriptContainer,
              {
                backgroundColor: colors.surface.grouped,
                borderRadius: radius.lg,
                padding: spacing.md,
                marginTop: spacing.xl,
              },
            ]}
          >
            <Text variant="body.secondary" color="secondary" style={{ marginBottom: spacing.xs }}>
              You said:
            </Text>
            <Text variant="body.primary">{transcript}</Text>
          </View>
        )}

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
  transcriptContainer: {
    width: '100%',
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
})
