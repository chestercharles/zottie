import { useState, useEffect, useRef } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import {
  useHouseholdMembership,
  useCreateHousehold,
} from '@/features/household'
import { NewShoppingListInputScreen } from './NewShoppingListInputScreen'
import { NewProcessingScreen } from './NewProcessingScreen'
import { useOnboardingItemParsing } from './hooks'
import { Text, Button } from '@/components'
import { useTheme } from '@/lib/theme'

type OnboardingStep = 'shopping' | 'processing'

interface ProcessingState {
  shoppingText: string
  shoppingError?: string
}

export function ConversationalOnboarding() {
  const router = useRouter()
  const { colors, spacing, radius } = useTheme()
  const { hasHousehold, isLoading: isLoadingHousehold } =
    useHouseholdMembership()
  const createHousehold = useCreateHousehold()
  const parseItems = useOnboardingItemParsing()
  const hasInitiatedCreation = useRef(false)
  const [householdCreationError, setHouseholdCreationError] = useState<
    string | null
  >(null)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('shopping')
  const [processingState, setProcessingState] = useState<ProcessingState>({
    shoppingText: '',
  })

  useEffect(() => {
    if (
      !hasHousehold &&
      !createHousehold.isPending &&
      !hasInitiatedCreation.current &&
      !householdCreationError
    ) {
      hasInitiatedCreation.current = true
      createHousehold.mutate(
        { name: 'My Household' },
        {
          onError: (error) => {
            console.error('Failed to auto-create household:', error)
            setHouseholdCreationError(
              error instanceof Error ? error.message : 'Failed to set up your account'
            )
          },
        }
      )
    }
  }, [hasHousehold, createHousehold.isPending, householdCreationError])

  const handleRetryHouseholdCreation = () => {
    setHouseholdCreationError(null)
    hasInitiatedCreation.current = false
  }

  const handleShoppingSubmit = (text: string) => {
    setProcessingState((prev) => ({ ...prev, shoppingText: text }))
    setCurrentStep('processing')
  }

  const handleShoppingSkip = () => {
    router.replace('/(authenticated)/pantry')
  }

  useEffect(() => {
    if (currentStep !== 'processing') return

    const processItems = async () => {
      try {
        if (processingState.shoppingText) {
          await parseItems
            .mutateAsync({
              text: processingState.shoppingText,
              context: 'shopping',
            })
            .catch((error) => {
              setProcessingState((prev) => ({
                ...prev,
                shoppingError:
                  error.message || 'Failed to add shopping list items',
              }))
              throw error
            })
        }

        if (!processingState.shoppingError) {
          router.replace('/(authenticated)/pantry')
        }
      } catch (error) {
        console.error('Error processing items:', error)
      }
    }

    processItems()
  }, [currentStep])

  const handleRetryShopping = () => {
    setProcessingState((prev) => ({ ...prev, shoppingError: undefined }))
    setCurrentStep('shopping')
  }

  if (householdCreationError) {
    return (
      <View
        style={[
          styles.errorContainer,
          {
            backgroundColor: colors.surface.background,
            paddingHorizontal: spacing.lg,
            gap: spacing.md,
          },
        ]}
      >
        <Text variant="title.medium" style={styles.errorTitle}>
          We couldn't get things set up
        </Text>
        <Text
          variant="body.primary"
          color="secondary"
          style={styles.errorMessage}
        >
          There was a problem connecting to our servers. Check your internet
          connection and try again.
        </Text>
        <View style={{ marginTop: spacing.lg }}>
          <Button title="Try again" onPress={handleRetryHouseholdCreation} />
        </View>
      </View>
    )
  }

  if (isLoadingHousehold || createHousehold.isPending || !hasHousehold) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.surface.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.action.primary} />
      </View>
    )
  }

  if (currentStep === 'shopping') {
    return (
      <NewShoppingListInputScreen
        onSubmit={handleShoppingSubmit}
        onSkip={handleShoppingSkip}
      />
    )
  }

  if (currentStep === 'processing') {
    if (processingState.shoppingError) {
      return (
        <View
          style={[
            styles.errorContainer,
            {
              backgroundColor: colors.surface.background,
              paddingHorizontal: spacing.lg,
              gap: spacing.lg,
            },
          ]}
        >
          <Text variant="title.medium" style={styles.errorTitle}>
            We had trouble processing your items
          </Text>
          <Text
            variant="body.primary"
            color="secondary"
            style={styles.errorMessage}
          >
            {processingState.shoppingError ||
              'Something went wrong. Please try again.'}
          </Text>
          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            <Button title="Try again" onPress={handleRetryShopping} />
            <Button
              variant="secondary"
              title="Continue anyway"
              onPress={() => router.replace('/(authenticated)/pantry')}
              style={{
                borderWidth: 1,
                borderColor: colors.border.subtle,
                borderRadius: radius.md,
              }}
            />
          </View>
        </View>
      )
    }

    return <NewProcessingScreen />
  }

  return null
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    paddingTop: 80,
  },
  errorTitle: {
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
  },
})
