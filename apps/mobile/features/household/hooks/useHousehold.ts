import { useQuery } from '@tanstack/react-query'
import { useAuth0 } from 'react-native-auth0'
import { queryKeys } from '@/lib/query/keys'
import { getHousehold } from '../api'
import { useAuth } from '@/features/auth'

export function useHousehold() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()

  const query = useQuery({
    queryKey: queryKeys.household(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')
      const credentials = await getCredentials()
      if (!credentials?.accessToken) throw new Error('No access token')
      return getHousehold(credentials.accessToken, user.id)
    },
    enabled: !!user?.id,
  })

  return {
    household: query.data?.household ?? null,
    members: query.data?.members ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
