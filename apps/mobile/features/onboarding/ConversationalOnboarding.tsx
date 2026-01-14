import { useState, useEffect } from 'react'
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useHouseholdMembership, useCreateHousehold } from '@/features/household'
import { NewPantryInputScreen } from './NewPantryInputScreen'
import { NewShoppingListInputScreen } from './NewShoppingListInputScreen'
import { NewProcessingScreen } from './NewProcessingScreen'
import { useOnboardingItemParsing } from './hooks'

type OnboardingStep = 'pantry' | 'shopping' | 'processing'

interface ProcessingState {
  pantryText: string
  shoppingText: string
  pantryError?: string
  shoppingError?: string
}

export function ConversationalOnboarding() {
  const router = useRouter()
  const { hasHousehold, isLoading: isLoadingHousehold } = useHouseholdMembership()
  const createHousehold = useCreateHousehold()
  const parseItems = useOnboardingItemParsing()
  const [isCreatingHousehold, setIsCreatingHousehold] = useState(false)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('pantry')
  const [processingState, setProcessingState] = useState<ProcessingState>({
    pantryText: '',
    shoppingText: '',
  })

  useEffect(() => {
    if (!hasHousehold && !isCreatingHousehold) {
      setIsCreatingHousehold(true)
      createHousehold
        .mutateAsync({ name: 'My Household' })
        .then(() => {
          setIsCreatingHousehold(false)
        })
        .catch((error) => {
          console.error('Failed to auto-create household:', error)
          setIsCreatingHousehold(false)
        })
    }
  }, [hasHousehold, isCreatingHousehold, createHousehold])

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
          router.replace('/(authenticated)/pantry')
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

  if (isLoadingHousehold || isCreatingHousehold || !hasHousehold) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
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
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            We had trouble processing your items
          </Text>
          <Text style={styles.errorMessage}>
            {processingState.pantryError ||
              processingState.shoppingError ||
              'Something went wrong. Please try again.'}
          </Text>
          <View style={styles.errorButtons}>
            {processingState.pantryError && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetryPantry}
              >
                <Text style={styles.retryButtonText}>Retry pantry items</Text>
              </TouchableOpacity>
            )}
            {processingState.shoppingError && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetryShopping}
              >
                <Text style={styles.retryButtonText}>
                  Retry shopping items
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.skipErrorButton}
              onPress={() => router.replace('/(authenticated)/pantry')}
            >
              <Text style={styles.skipErrorButtonText}>Continue anyway</Text>
            </TouchableOpacity>
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

  return null
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 80,
    gap: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorButtons: {
    marginTop: 20,
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#3498DB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipErrorButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipErrorButtonText: {
    color: '#7F8C8D',
    fontSize: 16,
    fontWeight: '600',
  },
})
