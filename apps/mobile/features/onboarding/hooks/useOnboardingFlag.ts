import { useQuery } from '@tanstack/react-query'
import { useAuth0 } from 'react-native-auth0'
import { queryKeys } from '@/lib/query/keys'
import { getOnboardingFlag } from '../api'
import { useAuth } from '@/features/auth'

export function useOnboardingFlag() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()

  const query = useQuery({
    queryKey: queryKeys.onboardingFlag(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')
      const credentials = await getCredentials()
      if (!credentials?.accessToken) throw new Error('No access token')
      return getOnboardingFlag(credentials.accessToken, user.id)
    },
    enabled: !!user?.id,
    staleTime: Infinity, // Flag shouldn't change during a session
  })

  return {
    flag: query.data?.flag ?? 'original',
    isLoading: query.isLoading,
    error: query.error,
  }
}
