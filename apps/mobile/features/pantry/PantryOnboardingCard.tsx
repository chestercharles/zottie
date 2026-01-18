import { useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { VoiceInput, Text, Card, Button } from '@/components'
import { useTheme } from '@/lib/theme'
import { useOnboardingItemParsing } from '@/features/onboarding/hooks'

type CardState = 'input' | 'processing' | 'error'

export function PantryOnboardingCard() {
  const { colors, spacing } = useTheme()
  const [cardState, setCardState] = useState<CardState>('input')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const parseItems = useOnboardingItemParsing()

  const handleTranscriptReceived = async (transcript: string) => {
    if (!transcript.trim()) return

    setCardState('processing')
    setErrorMessage(null)

    try {
      await parseItems.mutateAsync({
        text: transcript,
        context: 'pantry',
      })
      setCardState('input')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      )
      setCardState('error')
    }
  }

  const handleRetry = () => {
    setCardState('input')
    setErrorMessage(null)
  }

  if (cardState === 'processing') {
    return (
      <Card style={{ marginBottom: spacing.lg }}>
        <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
          <ActivityIndicator size="large" color={colors.action.primary} />
          <Text
            variant="body.primary"
            color="secondary"
            style={{ marginTop: spacing.md }}
          >
            Adding items to your pantry...
          </Text>
        </View>
      </Card>
    )
  }

  if (cardState === 'error') {
    return (
      <Card style={{ marginBottom: spacing.lg }}>
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <Ionicons
            name="alert-circle-outline"
            size={40}
            color={colors.feedback.warning}
          />
          <Text
            variant="body.primary"
            color="secondary"
            style={{ textAlign: 'center' }}
          >
            {errorMessage}
          </Text>
          <Button title="Try again" onPress={handleRetry} />
        </View>
      </Card>
    )
  }

  return (
    <Card style={{ marginBottom: spacing.lg }}>
      <View style={{ alignItems: 'center', gap: spacing.md }}>
        <Ionicons
          name="basket-outline"
          size={48}
          color={colors.action.primary}
        />
        <Text
          variant="title.small"
          style={{ textAlign: 'center' }}
        >
          Tell me what's in your pantry
        </Text>
        <Text
          variant="body.secondary"
          color="secondary"
          style={{ textAlign: 'center', lineHeight: 20 }}
        >
          I can help you figure out what to make for dinner, remind you when
          you're running low, and keep your shopping list updated automatically.
        </Text>
        <View style={{ paddingVertical: spacing.md }}>
          <VoiceInput
            onTranscriptReceived={handleTranscriptReceived}
            buttonSize={100}
            statusTextIdle="Tap to speak"
            statusTextRecording="Tap to stop"
            contextualStrings={['pantry', 'in stock', 'running low', 'have']}
          />
        </View>
        <Text
          variant="caption"
          color="tertiary"
          style={{ textAlign: 'center', fontStyle: 'italic' }}
        >
          List items you have at home, like "milk, eggs, bread, and some
          leftover chicken"
        </Text>
      </View>
    </Card>
  )
}
