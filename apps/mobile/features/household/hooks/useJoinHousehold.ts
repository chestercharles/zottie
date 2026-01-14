import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from 'react-native-auth0'
import { queryKeys } from '@/lib/query/keys'
import { joinHousehold } from '../api'
import { useAuth } from '@/features/auth'

export function useJoinHousehold() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      if (!user?.id) throw new Error('Not authenticated')
      const credentials = await getCredentials()
      if (!credentials?.accessToken) throw new Error('No access token')
      return joinHousehold(code, credentials.accessToken, user.id)
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.household(user.id),
        })
      }
    },
  })
}
