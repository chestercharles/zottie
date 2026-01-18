import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useAuth0 } from 'react-native-auth0'
import { useMemo, useState, useCallback } from 'react'
import { useAuth } from '@/features/auth'
import { queryKeys } from '@/lib/query'
import { listGotos } from '../api'
import type { Goto } from '../types'

export function useGotos() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const query = useQuery({
    queryKey: queryKeys.gotos(user?.id ?? ''),
    queryFn: async (): Promise<Goto[]> => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      const credentials = await getCredentials()
      if (!credentials?.accessToken) {
        throw new Error('No access token available')
      }
      return listGotos(credentials.accessToken, user.id)
    },
    enabled: !!user?.id,
    placeholderData: keepPreviousData,
  })

  const sortedGotos = useMemo(
    () =>
      [...(query.data ?? [])].sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      ),
    [query.data]
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
    gotos: sortedGotos,
    isLoading: query.isLoading && !query.isPlaceholderData,
    isRefreshing,
    error: query.error?.message ?? null,
    refetch,
  }
}
