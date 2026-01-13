import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { JoinScreen, usePendingInvite } from '@/features/household'
import { useAuth } from '@/features/auth'

export default function JoinRoute() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { signIn, isAuthenticated, isLoading } = useAuth()
  const { storePendingInvite, clearPendingInvite } = usePendingInvite()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated && code) {
      storePendingInvite(code)
    }
  }, [isLoading, isAuthenticated, code, storePendingInvite])

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

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(authenticated)/pantry')
    }
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
      onCancel={handleCancel}
    />
  )
}
