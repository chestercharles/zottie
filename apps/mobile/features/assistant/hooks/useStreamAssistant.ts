import { useState, useCallback } from 'react'
import { useAuth0 } from 'react-native-auth0'
import { useAuth } from '@/features/auth'
import { streamAssistantChat } from '../api'

type StreamState = 'idle' | 'streaming' | 'error'

export function useStreamAssistant() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const [response, setResponse] = useState('')
  const [streamState, setStreamState] = useState<StreamState>('idle')
  const [error, setError] = useState<string | null>(null)

  const streamMessage = useCallback(
    async (message: string) => {
      if (!user?.id) {
        setError('User not authenticated')
        setStreamState('error')
        return
      }

      setStreamState('streaming')
      setResponse('')
      setError(null)

      try {
        const credentials = await getCredentials()
        if (!credentials?.accessToken) {
          throw new Error('No access token available')
        }

        for await (const chunk of streamAssistantChat(
          message,
          credentials.accessToken,
          user.id
        )) {
          setResponse((prev) => prev + chunk)
        }
        setStreamState('idle')
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Something went wrong'
        setError(errorMessage)
        setStreamState('error')
      }
    },
    [user?.id, getCredentials]
  )

  const reset = useCallback(() => {
    setResponse('')
    setStreamState('idle')
    setError(null)
  }, [])

  return {
    response,
    isStreaming: streamState === 'streaming',
    error,
    streamMessage,
    reset,
  }
}
