import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from 'react-native-auth0'
import { useAuth } from '@/features/auth'
import { queryKeys } from '@/lib/query'
import { parseCommand, executeCommand } from '@/features/commands/api'

interface ParseAndExecuteParams {
  text: string
  context: 'pantry' | 'shopping'
}

export function useOnboardingItemParsing() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ text, context }: ParseAndExecuteParams) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      const credentials = await getCredentials()
      if (!credentials?.accessToken) {
        throw new Error('No access token available')
      }

      // Construct a command that provides context about what the user is adding
      const contextualCommand =
        context === 'pantry'
          ? `I have: ${text}`
          : `I need to buy: ${text}`

      // Parse the command
      const parseResponse = await parseCommand(
        { command: contextualCommand },
        credentials.accessToken,
        user.id
      )

      // Execute the actions if any were parsed
      if (parseResponse.result.actions.length > 0) {
        await executeCommand(
          { actions: parseResponse.result.actions },
          credentials.accessToken,
          user.id
        )
      }

      return parseResponse
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
