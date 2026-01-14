import { useState, useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useHouseholdMembership, useCreateHousehold } from '@/features/household'
import { NewPantryInputScreen } from './NewPantryInputScreen'
import { NewShoppingListInputScreen } from './NewShoppingListInputScreen'

type OnboardingStep = 'pantry' | 'shopping'

export function ConversationalOnboarding() {
  const router = useRouter()
  const { hasHousehold, isLoading: isLoadingHousehold } = useHouseholdMembership()
  const createHousehold = useCreateHousehold()
  const [isCreatingHousehold, setIsCreatingHousehold] = useState(false)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('pantry')
  const [pantryInput, setPantryInput] = useState<string>('')

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
    setPantryInput(text)
    setCurrentStep('shopping')
  }

  const handlePantrySkip = () => {
    setPantryInput('')
    setCurrentStep('shopping')
  }

  const handleShoppingSubmit = (text: string) => {
    router.replace('/(authenticated)/pantry')
  }

  const handleShoppingSkip = () => {
    router.replace('/(authenticated)/pantry')
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

  return (
    <NewShoppingListInputScreen
      onSubmit={handleShoppingSubmit}
      onSkip={handleShoppingSkip}
    />
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
})
