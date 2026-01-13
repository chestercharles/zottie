import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
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

export function usePendingInvite() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [pendingInvite, setPendingInvite] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    async function checkPendingInvite() {
      if (isAuthenticated) {
        const code = await getPendingInvite()
        if (code) {
          await clearPendingInvite()
          setPendingInvite(code)
        }
      }
      setIsChecking(false)
    }
    if (!isAuthLoading) {
      checkPendingInvite()
    }
  }, [isAuthenticated, isAuthLoading])

  const store = useCallback(async (code: string) => {
    await storePendingInvite(code)
  }, [])

  const clear = useCallback(async () => {
    await clearPendingInvite()
    setPendingInvite(null)
  }, [])

  return {
    pendingInvite,
    isChecking,
    storePendingInvite: store,
    clearPendingInvite: clear,
  }
}
