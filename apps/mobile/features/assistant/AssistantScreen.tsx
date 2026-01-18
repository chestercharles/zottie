import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../lib/theme'
import { Text } from '../../components/ui'

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

  const handleVoicePress = () => {
    // Placeholder - voice input will be implemented in a future PRD
  }

  const handlePromptPress = (_promptId: string) => {
    // Placeholder - prompt handling will be implemented in a future PRD
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface.background }]}>
      <View style={[styles.content, { padding: spacing.lg }]}>
        <TouchableOpacity
          style={[
            styles.voiceButton,
            {
              backgroundColor: colors.action.primary,
              width: 120,
              height: 120,
              borderRadius: 60,
            },
          ]}
          onPress={handleVoicePress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Start voice input"
        >
          <Ionicons name="mic" size={48} color={colors.text.inverse} />
        </TouchableOpacity>

        <Text
          variant="body.secondary"
          color="secondary"
          style={{ marginTop: spacing.lg, textAlign: 'center' }}
        >
          Tap to speak with your assistant
        </Text>

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
    alignItems: 'center',
    paddingTop: 60,
  },
  voiceButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
