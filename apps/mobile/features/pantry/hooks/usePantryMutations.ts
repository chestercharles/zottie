import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from 'react-native-auth0'
import { useAuth } from '@/features/auth'
import { queryKeys } from '@/lib/query'
import { createPantryItem, updatePantryItem, deletePantryItem } from '../api'
import type { CreatePantryItemRequest, PantryItemStatus } from '../types'

export function useCreatePantryItem() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePantryItemRequest) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      const credentials = await getCredentials()
      if (!credentials?.accessToken) {
        throw new Error('No access token available')
      }
      return createPantryItem(data, credentials.accessToken, user.id)
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.pantryItems(user.id) })
      }
    },
  })
}

export function useUpdatePantryItem() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      itemId,
      status,
      name,
    }: {
      itemId: string
      status?: PantryItemStatus
      name?: string
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      const credentials = await getCredentials()
      if (!credentials?.accessToken) {
        throw new Error('No access token available')
      }
      return updatePantryItem(itemId, { status, name }, credentials.accessToken, user.id)
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.pantryItems(user.id) })
      }
    },
  })
}

export function useDeletePantryItem() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      const credentials = await getCredentials()
      if (!credentials?.accessToken) {
        throw new Error('No access token available')
      }
      return deletePantryItem(itemId, credentials.accessToken, user.id)
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.pantryItems(user.id) })
      }
    },
  })
}
