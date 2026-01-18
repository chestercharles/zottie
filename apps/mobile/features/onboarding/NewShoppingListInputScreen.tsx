import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { VoiceInput } from '../../components/VoiceInput'
import { useTheme } from '../../lib/theme'
import { Text, Button } from '../../components/ui'

interface NewShoppingListInputScreenProps {
  onSubmit: (text: string) => void
  onSkip: () => void
}

export function NewShoppingListInputScreen({
  onSubmit,
  onSkip,
}: NewShoppingListInputScreenProps) {
  const [transcript, setTranscript] = useState('')
  const insets = useSafeAreaInsets()
  const { colors, spacing } = useTheme()

  const handleTranscriptReceived = (text: string) => {
    setTranscript(text)
  }

  const handleSubmit = () => {
    onSubmit(transcript.trim())
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface.background,
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      <View style={[styles.content, { paddingTop: 60, gap: spacing.md }]}>
        <Ionicons name="cart" size={64} color={colors.action.primary} />
        <Text variant="title.large" style={{ marginTop: spacing.md }}>
          What should we add to your shopping list?
        </Text>
        <Text
          variant="body.primary"
          color="secondary"
          style={{ lineHeight: 24 }}
        >
          List anything you want to pick up on your next shopping trip. You can
          always add more or make changes later.
        </Text>

        <View
          style={[styles.voiceInputContainer, { paddingVertical: spacing.xl }]}
        >
          <VoiceInput
            onTranscriptReceived={handleTranscriptReceived}
            statusTextIdle="Tap to speak"
            statusTextRecording="Tap to stop"
            statusTextProcessing="Processing..."
            buttonSize={140}
          />
        </View>

        <Text
          variant="body.secondary"
          color="tertiary"
          style={{ fontStyle: 'italic', lineHeight: 20 }}
        >
          Tap the microphone and tell me what to add, or skip if you're all set
          for now.
        </Text>
      </View>

      <View
        style={[
          styles.footer,
          {
            gap: spacing.sm,
            paddingTop: spacing.lg,
            paddingBottom: Math.max(insets.bottom, spacing.md),
          },
        ]}
      >
        <Button
          variant="secondary"
          title="Skip"
          onPress={onSkip}
          style={styles.skipButton}
        />
        <Button
          title="Continue"
          onPress={handleSubmit}
          disabled={!transcript.trim()}
          style={styles.continueButton}
        />
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
  },
  voiceInputContainer: {
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
  },
  skipButton: {
    flex: 1,
  },
  continueButton: {
    flex: 2,
  },
})
