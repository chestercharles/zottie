import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { JoinScreen } from '@/features/household'
import { useAuth } from '@/features/auth'

const PENDING_INVITE_KEY = 'pendingInviteCode'

export async function storePendingInvite(code: string) {
  await AsyncStorage.setItem(PENDING_INVITE_KEY, code)
}

export async function getPendingInvite(): Promise<string | null> {
  return AsyncStorage.getItem(PENDING_INVITE_KEY)
}

export async function clearPendingInvite() {
  await AsyncStorage.removeItem(PENDING_INVITE_KEY)
}

export default function JoinRoute() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { signIn, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated && code) {
      storePendingInvite(code)
    }
  }, [isLoading, isAuthenticated, code])

  const handleSignIn = async () => {
    try {
      await signIn()
    } catch (error) {
      console.error('Sign in failed:', error)
    }
  }

  const handleJoinSuccess = async () => {
    await clearPendingInvite()
    router.replace('/(authenticated)/pantry')
  }

  if (!code) {
    router.replace('/')
    return null
  }

  return (
    <JoinScreen
      code={code}
      onSignIn={handleSignIn}
      onJoinSuccess={handleJoinSuccess}
    />
  )
}
