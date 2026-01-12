import { LandingScreen } from '@/features/landing/LandingScreen'
import { useAuth } from '@/features/auth'
import { Redirect } from 'expo-router'
import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const PENDING_INVITE_KEY = 'pendingInviteCode'

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth()
  const [pendingInvite, setPendingInvite] = useState<string | null>(null)
  const [checkingInvite, setCheckingInvite] = useState(true)

  useEffect(() => {
    async function checkPendingInvite() {
      if (isAuthenticated) {
        const code = await AsyncStorage.getItem(PENDING_INVITE_KEY)
        if (code) {
          await AsyncStorage.removeItem(PENDING_INVITE_KEY)
          setPendingInvite(code)
        }
      }
      setCheckingInvite(false)
    }
    if (!isLoading) {
      checkPendingInvite()
    }
  }, [isAuthenticated, isLoading])

  if (isLoading || checkingInvite) {
    return null
  }

  if (isAuthenticated) {
    if (pendingInvite) {
      return <Redirect href={`/join/${pendingInvite}`} />
    }
    return <Redirect href="/(authenticated)/pantry" />
  }

  return <LandingScreen />
}
