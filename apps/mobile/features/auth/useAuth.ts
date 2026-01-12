import { useCallback } from 'react'
import { useAuth0 } from 'react-native-auth0'

export function useAuth() {
  const { authorize, clearSession, user, isLoading, error } = useAuth0()

  const signIn = useCallback(async () => {
    await authorize()
  }, [authorize])

  const signOut = useCallback(async () => {
    await clearSession()
  }, [clearSession])

  return {
    user: user
      ? {
          id: user.sub ?? '',
          email: user.email ?? '',
          name: user.name,
          picture: user.picture,
        }
      : null,
    isAuthenticated: !!user,
    isLoading,
    error,
    signIn,
    signUp: signIn, // Auth0 Universal Login handles both
    signOut,
  }
}
