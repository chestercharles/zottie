import { LandingScreen } from '@/features/landing/LandingScreen'
import { useAuth } from '@/features/auth'
import { Redirect } from 'expo-router'

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (isAuthenticated) {
    return <Redirect href="/(authenticated)/home" />
  }

  return <LandingScreen />
}
