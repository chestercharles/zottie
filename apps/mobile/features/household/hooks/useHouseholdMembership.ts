import { useQuery } from '@tanstack/react-query'
import { useAuth0 } from 'react-native-auth0'
import { queryKeys } from '@/lib/query/keys'
import { getHouseholdMembership } from '../api'
import { useAuth } from '@/features/auth'

export function useHouseholdMembership() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()

  const query = useQuery({
    queryKey: queryKeys.householdMembership(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')
      const credentials = await getCredentials()
      if (!credentials?.accessToken) throw new Error('No access token')
      return getHouseholdMembership(credentials.accessToken, user.id)
    },
    enabled: !!user?.id,
  })

  return {
    household: query.data?.household ?? null,
    members: query.data?.members ?? [],
    hasHousehold: query.data !== null && query.data !== undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
