import { useQuery } from '@tanstack/react-query'
import { useAuth0 } from 'react-native-auth0'
import { queryKeys } from '@/lib/query/keys'
import { validateInvite } from '../api'
import { useAuth } from '@/features/auth'

export function useValidateInvite(code: string | null) {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()

  const query = useQuery({
    queryKey: queryKeys.householdInvite(code ?? ''),
    queryFn: async () => {
      if (!code) throw new Error('No invite code')
      if (!user?.id) throw new Error('Not authenticated')
      const credentials = await getCredentials()
      if (!credentials?.accessToken) throw new Error('No access token')
      return validateInvite(code, credentials.accessToken, user.id)
    },
    enabled: !!code && !!user?.id,
    retry: false,
  })

  return {
    invite: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
