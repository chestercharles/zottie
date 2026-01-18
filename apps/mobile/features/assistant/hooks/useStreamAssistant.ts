import { useState, useCallback, useRef, useEffect } from 'react'
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
  const abortRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.()
    }
  }, [])

  const streamMessage = useCallback(
    async (message: string) => {
      if (!user?.id) {
        setError('User not authenticated')
        setStreamState('error')
        return
      }

      abortRef.current?.()

      setStreamState('streaming')
      setResponse('')
      setError(null)

      try {
        const credentials = await getCredentials()
        if (!credentials?.accessToken) {
          throw new Error('No access token available')
        }

        abortRef.current = streamAssistantChat(
          message,
          credentials.accessToken,
          user.id,
          (chunk) => {
            setResponse((prev) => prev + chunk)
          },
          (err) => {
            setError(err.message)
            setStreamState('error')
            abortRef.current = null
          },
          () => {
            setStreamState('idle')
            abortRef.current = null
          }
        )
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
    abortRef.current?.()
    abortRef.current = null
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
