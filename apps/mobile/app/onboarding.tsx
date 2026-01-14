import { useState } from 'react'
import {
  CreateHouseholdScreen,
  QuickAddInventoryScreen,
} from '@/features/onboarding'
import { useRouter, Redirect } from 'expo-router'
import { useHouseholdMembership } from '@/features/household'

export default function OnboardingRoute() {
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
    return null
  }

  if (hasHousehold && onCreateHouseholdStep) {
    return <Redirect href="/(authenticated)/pantry" />
  }

  if (onCreateHouseholdStep) {
    return <CreateHouseholdScreen onSuccess={handleHouseholdCreated} />
  }

  return <QuickAddInventoryScreen onComplete={handleQuickAddComplete} />
}
