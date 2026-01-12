import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useAuth0 } from 'react-native-auth0'
import { useState, useCallback } from 'react'
import { useAuth } from '@/features/auth'
import { queryKeys } from '@/lib/query'
import { listPantryItems } from '@/features/pantry/api'
import type { ShoppingItem } from '../types'

export function useShoppingItems() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const query = useQuery({
    queryKey: queryKeys.pantryItems(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      const credentials = await getCredentials()
      if (!credentials?.accessToken) {
        throw new Error('No access token available')
      }
      return listPantryItems(credentials.accessToken, user.id)
    },
    enabled: !!user?.id,
    placeholderData: keepPreviousData,
    select: (items): ShoppingItem[] =>
      items.filter(
        (item) =>
          item.status === 'running_low' ||
          item.status === 'out_of_stock' ||
          item.status === 'planned'
      ),
  })

  const refetch = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await query.refetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [query])

  return {
    items: query.data ?? [],
    isLoading: query.isLoading && !query.isPlaceholderData,
    isRefreshing,
    error: query.error?.message ?? null,
    refetch,
  }
}
