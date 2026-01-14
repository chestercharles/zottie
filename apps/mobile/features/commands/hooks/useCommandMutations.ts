import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from 'react-native-auth0'
import { useAuth } from '@/features/auth'
import { queryKeys } from '@/lib/query'
import { parseCommand, executeCommand } from '../api'
import type { CommandAction } from '../types'

export function useParseCommand() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()

  return useMutation({
    mutationFn: async (command: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      const credentials = await getCredentials()
      if (!credentials?.accessToken) {
        throw new Error('No access token available')
      }
      return parseCommand({ command }, credentials.accessToken, user.id)
    },
  })
}

export function useExecuteCommand() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (actions: CommandAction[]) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      const credentials = await getCredentials()
      if (!credentials?.accessToken) {
        throw new Error('No access token available')
      }
      return executeCommand({ actions }, credentials.accessToken, user.id)
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
