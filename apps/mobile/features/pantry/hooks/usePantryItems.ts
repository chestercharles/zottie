import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useAuth0 } from 'react-native-auth0'
import { useMemo, useState, useCallback } from 'react'
import { useAuth } from '@/features/auth'
import { queryKeys } from '@/lib/query'
import { listPantryItems } from '../api'
import type { PantryItem } from '../types'

export function usePantryItems(searchTerm: string = '') {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const query = useQuery({
    queryKey: queryKeys.pantryItems(user?.id ?? ''),
    queryFn: async (): Promise<PantryItem[]> => {
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
  })

  const normalizedSearch = searchTerm.toLowerCase().trim()

  const filteredItems = useMemo(
    () =>
      normalizedSearch
        ? (query.data ?? []).filter((item) =>
            item.name.toLowerCase().includes(normalizedSearch)
          )
        : (query.data ?? []),
    [query.data, normalizedSearch]
  )

  const mainListItems = useMemo(
    () =>
      filteredItems
        .filter(
          (item) =>
            item.itemType === 'staple' ||
            (item.itemType === 'planned' && item.status !== 'planned')
        )
        .sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        ),
    [filteredItems]
  )

  const plannedItems = useMemo(
    () =>
      filteredItems
        .filter(
          (item) => item.itemType === 'planned' && item.status === 'planned'
        )
        .sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        ),
    [filteredItems]
  )

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
    mainListItems,
    plannedItems,
    isLoading: query.isLoading && !query.isPlaceholderData,
    isRefreshing,
    error: query.error?.message ?? null,
    refetch,
  }
}
