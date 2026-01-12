import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from 'react-native-auth0'
import { queryKeys } from '@/lib/query/keys'
import { createHousehold } from '../api'
import { useAuth } from '@/features/auth'

export function useCreateHousehold() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      if (!user?.id) throw new Error('Not authenticated')
      const credentials = await getCredentials()
      if (!credentials?.accessToken) throw new Error('No access token')
      return createHousehold({ name }, credentials.accessToken, user.id)
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.household(user.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.householdMembership(user.id) })
      }
    },
  })
}
