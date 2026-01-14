import { useState, useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useHouseholdMembership, useCreateHousehold } from '@/features/household'
import { NewPantryInputScreen } from './NewPantryInputScreen'

export function ConversationalOnboarding() {
  const router = useRouter()
  const { hasHousehold, isLoading: isLoadingHousehold } = useHouseholdMembership()
  const createHousehold = useCreateHousehold()
  const [isCreatingHousehold, setIsCreatingHousehold] = useState(false)

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

  const handleComplete = () => {
    router.replace('/(authenticated)/pantry')
  }

  const handleSkip = () => {
    router.replace('/(authenticated)/pantry')
  }

  if (isLoadingHousehold || isCreatingHousehold || !hasHousehold) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    )
  }

  return <NewPantryInputScreen onSubmit={handleComplete} onSkip={handleSkip} />
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
})
