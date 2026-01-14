import { useState } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter, Redirect } from 'expo-router'
import { useHouseholdMembership } from '@/features/household'
import { CreateHouseholdScreen } from './CreateHouseholdScreen'
import { QuickAddInventoryScreen } from './QuickAddInventoryScreen'

export function OriginalOnboarding() {
  const router = useRouter()
  const { hasHousehold, isLoading } = useHouseholdMembership()
  const [onCreateHouseholdStep, setOnCreateHouseholdStep] = useState(true)

  const handleHouseholdCreated = () => {
    setOnCreateHouseholdStep(false)
  }

  const handleQuickAddComplete = () => {
    router.replace('/(authenticated)/pantry')
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    )
  }

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
