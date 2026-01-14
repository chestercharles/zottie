import { useState, useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import {
  CreateHouseholdScreen,
  QuickAddInventoryScreen,
  NewPantryInputScreen,
  useOnboardingFlag,
} from '@/features/onboarding'
import { useRouter, Redirect } from 'expo-router'
import { useHouseholdMembership, useCreateHousehold } from '@/features/household'

export default function OnboardingRoute() {
  const router = useRouter()
  const { hasHousehold, isLoading: isLoadingHousehold } = useHouseholdMembership()
  const { flag, isLoading: isLoadingFlag } = useOnboardingFlag()
  const createHousehold = useCreateHousehold()
  const [onCreateHouseholdStep, setOnCreateHouseholdStep] = useState(true)
  const [isCreatingHousehold, setIsCreatingHousehold] = useState(false)

  // Auto-create household for conversational flow
  useEffect(() => {
    if (flag === 'conversational' && !hasHousehold && !isCreatingHousehold) {
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
  }, [flag, hasHousehold, isCreatingHousehold, createHousehold])

  const handleHouseholdCreated = () => {
    setOnCreateHouseholdStep(false)
  }

  const handleQuickAddComplete = () => {
    router.replace('/(authenticated)/pantry')
  }

  const handlePantryInputComplete = () => {
    router.replace('/(authenticated)/pantry')
  }

  const handlePantryInputSkip = () => {
    router.replace('/(authenticated)/pantry')
  }

  // Show loading while fetching flag or household membership
  if (isLoadingFlag || isLoadingHousehold) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    )
  }

  // Conversational onboarding flow
  if (flag === 'conversational') {
    // Show loading while auto-creating household
    if (isCreatingHousehold || !hasHousehold) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498DB" />
        </View>
      )
    }

    // Show pantry input screen (first screen of conversational flow)
    return (
      <NewPantryInputScreen
        onSubmit={handlePantryInputComplete}
        onSkip={handlePantryInputSkip}
      />
    )
  }

  // Original onboarding flow
  if (hasHousehold && onCreateHouseholdStep) {
    return <Redirect href="/(authenticated)/pantry" />
  }

  if (onCreateHouseholdStep) {
    return <CreateHouseholdScreen onSuccess={handleHouseholdCreated} />
  }

  return <QuickAddInventoryScreen onComplete={handleQuickAddComplete} />
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
})
