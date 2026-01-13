import { OnboardingScreen } from '@/features/onboarding'
import { useRouter, Redirect } from 'expo-router'
import { useHouseholdMembership } from '@/features/household'

export default function OnboardingRoute() {
  const router = useRouter()
  const { hasHousehold, isLoading } = useHouseholdMembership()

  const handleSuccess = () => {
    router.replace('/(authenticated)/pantry')
  }

  if (isLoading) {
    return null
  }

  if (hasHousehold) {
    return <Redirect href="/(authenticated)/pantry" />
  }

  return <OnboardingScreen onSuccess={handleSuccess} />
}
