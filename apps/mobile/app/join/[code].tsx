import { useLocalSearchParams, useRouter } from 'expo-router'
import { JoinScreen } from '@/features/household'

export default function JoinRoute() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const router = useRouter()

  if (!code) {
    router.replace('/')
    return null
  }

  return <JoinScreen />
}
