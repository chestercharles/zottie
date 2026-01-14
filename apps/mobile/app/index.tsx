import { LandingScreen } from '@/features/landing/LandingScreen'
import { useAuth } from '@/features/auth'
import { usePendingInvite, useHouseholdMembership } from '@/features/household'
import { Redirect } from 'expo-router'

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth()
  const { pendingInvite, isChecking } = usePendingInvite()
  const { hasHousehold, isLoading: isLoadingHousehold } =
    useHouseholdMembership()

  if (isLoading || isChecking) {
    return null
  }

  if (!isAuthenticated) {
    return <LandingScreen />
  }

  if (isLoadingHousehold) {
    return null
  }

  if (pendingInvite) {
    return <Redirect href={`/join/${pendingInvite}`} />
  }

  if (!hasHousehold) {
    return <Redirect href="/onboarding" />
  }

  return <Redirect href="/(authenticated)/pantry" />
}
