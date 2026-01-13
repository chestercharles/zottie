import { OnboardingScreen } from '@/features/onboarding'
import { useRouter } from 'expo-router'

export default function OnboardingRoute() {
  const router = useRouter()

  const handleSuccess = () => {
    router.replace('/(authenticated)/pantry')
  }

  return <OnboardingScreen onSuccess={handleSuccess} />
}
