import { useState } from 'react'
import {
  OnboardingScreen,
  QuickAddInventoryScreen,
} from '@/features/onboarding'
import { useRouter, Redirect } from 'expo-router'
import { useHouseholdMembership } from '@/features/household'

export default function OnboardingRoute() {
  const router = useRouter()
  const { hasHousehold, isLoading } = useHouseholdMembership()
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const handleHouseholdCreated = () => {
    setShowQuickAdd(true)
  }

  const handleQuickAddComplete = () => {
    router.replace('/(authenticated)/pantry')
  }

  if (isLoading) {
    return null
  }

  if (hasHousehold) {
    return <Redirect href="/(authenticated)/pantry" />
  }

  if (showQuickAdd) {
    return <QuickAddInventoryScreen onComplete={handleQuickAddComplete} />
  }

  return <OnboardingScreen onSuccess={handleHouseholdCreated} />
}
