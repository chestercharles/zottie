import { useState } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter, Redirect } from 'expo-router'
import { useHouseholdMembership } from '@/features/household'
import { CreateHouseholdScreen } from './CreateHouseholdScreen'
import { QuickAddInventoryScreen } from './QuickAddInventoryScreen'
import { useTheme } from '@/lib/theme'

export function OriginalOnboarding() {
  const router = useRouter()
  const { colors } = useTheme()
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
  },
})
