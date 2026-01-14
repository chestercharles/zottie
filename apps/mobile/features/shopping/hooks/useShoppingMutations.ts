import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from 'react-native-auth0'
import { useAuth } from '@/features/auth'
import { queryKeys } from '@/lib/query'
import { markItemsAsPurchased, createPlannedItem } from '../api'

export function useMarkAsPurchased() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemIds: string[]) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      const credentials = await getCredentials()
      if (!credentials?.accessToken) {
        throw new Error('No access token available')
      }
      return markItemsAsPurchased(itemIds, credentials.accessToken, user.id)
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.pantryItems(user.id),
        })
      }
    },
  })
}

export function useCreatePlannedItem() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      const credentials = await getCredentials()
      if (!credentials?.accessToken) {
        throw new Error('No access token available')
      }
      return createPlannedItem(name, credentials.accessToken, user.id)
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.pantryItems(user.id),
        })
      }
    },
  })
}
