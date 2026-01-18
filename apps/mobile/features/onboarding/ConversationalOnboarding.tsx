import { useState, useEffect, useRef } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import {
  useHouseholdMembership,
  useCreateHousehold,
} from '@/features/household'
import { NewPantryInputScreen } from './NewPantryInputScreen'
import { NewShoppingListInputScreen } from './NewShoppingListInputScreen'
import { NewProcessingScreen } from './NewProcessingScreen'
import { NewHouseholdInvitationScreen } from './NewHouseholdInvitationScreen'
import { useOnboardingItemParsing } from './hooks'
import { Text, Button } from '@/components'
import { useTheme } from '@/lib/theme'

type OnboardingStep = 'pantry' | 'shopping' | 'processing' | 'invitation'

interface ProcessingState {
  pantryText: string
  shoppingText: string
  pantryError?: string
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
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('pantry')
  const [processingState, setProcessingState] = useState<ProcessingState>({
    pantryText: '',
    shoppingText: '',
  })

  useEffect(() => {
    if (
      !hasHousehold &&
      !createHousehold.isPending &&
      !hasInitiatedCreation.current
    ) {
      hasInitiatedCreation.current = true
      createHousehold.mutate(
        { name: 'My Household' },
        {
          onError: (error) => {
            console.error('Failed to auto-create household:', error)
            hasInitiatedCreation.current = false
          },
        }
      )
    }
  }, [hasHousehold, createHousehold.isPending])

  const handlePantrySubmit = (text: string) => {
    setProcessingState((prev) => ({ ...prev, pantryText: text }))
    setCurrentStep('shopping')
  }

  const handlePantrySkip = () => {
    setProcessingState((prev) => ({ ...prev, pantryText: '' }))
    setCurrentStep('shopping')
  }

  const handleShoppingSubmit = (text: string) => {
    setProcessingState((prev) => ({ ...prev, shoppingText: text }))
    setCurrentStep('processing')
  }

  const handleShoppingSkip = () => {
    setProcessingState((prev) => ({ ...prev, shoppingText: '' }))
    setCurrentStep('processing')
  }

  useEffect(() => {
    if (currentStep !== 'processing') return

    const processItems = async () => {
      try {
        const promises: Promise<unknown>[] = []

        if (processingState.pantryText) {
          promises.push(
            parseItems
              .mutateAsync({
                text: processingState.pantryText,
                context: 'pantry',
              })
              .catch((error) => {
                setProcessingState((prev) => ({
                  ...prev,
                  pantryError: error.message || 'Failed to add pantry items',
                }))
                throw error
              })
          )
        }

        if (processingState.shoppingText) {
          promises.push(
            parseItems
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
          )
        }

        if (promises.length > 0) {
          await Promise.allSettled(promises)
        }

        if (!processingState.pantryError && !processingState.shoppingError) {
          setCurrentStep('invitation')
        }
      } catch (error) {
        console.error('Error processing items:', error)
      }
    }

    processItems()
  }, [currentStep])

  const handleRetryPantry = () => {
    setProcessingState((prev) => ({ ...prev, pantryError: undefined }))
    setCurrentStep('pantry')
  }

  const handleRetryShopping = () => {
    setProcessingState((prev) => ({ ...prev, shoppingError: undefined }))
    setCurrentStep('shopping')
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

  if (currentStep === 'pantry') {
    return (
      <NewPantryInputScreen
        onSubmit={handlePantrySubmit}
        onSkip={handlePantrySkip}
      />
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
    if (processingState.pantryError || processingState.shoppingError) {
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
            {processingState.pantryError ||
              processingState.shoppingError ||
              'Something went wrong. Please try again.'}
          </Text>
          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            {processingState.pantryError && (
              <Button title="Retry pantry items" onPress={handleRetryPantry} />
            )}
            {processingState.shoppingError && (
              <Button
                title="Retry shopping items"
                onPress={handleRetryShopping}
              />
            )}
            <Button
              variant="secondary"
              title="Continue anyway"
              onPress={() => setCurrentStep('invitation')}
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

    const step =
      processingState.pantryText && processingState.shoppingText
        ? 'both'
        : processingState.pantryText
          ? 'pantry'
          : 'shopping'

    return <NewProcessingScreen step={step} />
  }

  if (currentStep === 'invitation') {
    return (
      <NewHouseholdInvitationScreen
        onContinue={() => router.replace('/(authenticated)/pantry')}
        onSkip={() => router.replace('/(authenticated)/pantry')}
      />
    )
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
