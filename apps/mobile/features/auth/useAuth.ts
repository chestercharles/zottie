import { useCallback } from 'react'
import { useAuth0 } from 'react-native-auth0'
import Constants from 'expo-constants'

const auth0Audience = Constants.expoConfig?.extra?.auth0Audience

export function useAuth() {
  const { authorize, clearCredentials, user, isLoading, error } = useAuth0()

  const signIn = useCallback(async () => {
    await authorize(
      {
        audience: auth0Audience,
        scope: 'openid profile email',
      },
      {
        ephemeralSession: true,
      }
    )
  }, [authorize])

  const signOut = useCallback(async () => {
    await clearCredentials()
  }, [clearCredentials])

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
