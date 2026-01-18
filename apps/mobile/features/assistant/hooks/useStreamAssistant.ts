import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth0 } from 'react-native-auth0'
import { useAuth } from '@/features/auth'
import { streamAssistantChat } from '../api'

type StreamState = 'idle' | 'streaming' | 'error'

export type ProposedAction = {
  type: 'add_to_pantry' | 'update_pantry_status'
  item: string
  status: 'in_stock' | 'running_low' | 'out_of_stock' | 'planned'
}

export type ProposedActions = {
  actions: ProposedAction[]
  summary: string
}

const PROPOSED_ACTIONS_MARKER = '[PROPOSED_ACTIONS]'

function parseStreamResponse(fullResponse: string): {
  textResponse: string
  proposedActions: ProposedActions | null
} {
  const markerIndex = fullResponse.indexOf(PROPOSED_ACTIONS_MARKER)

  if (markerIndex === -1) {
    return { textResponse: fullResponse, proposedActions: null }
  }

  const textResponse = fullResponse.slice(0, markerIndex).trim()
  const actionsJson = fullResponse.slice(
    markerIndex + PROPOSED_ACTIONS_MARKER.length
  )

  try {
    const proposedActions = JSON.parse(actionsJson) as ProposedActions
    return { textResponse, proposedActions }
  } catch {
    return { textResponse: fullResponse, proposedActions: null }
  }
}

export function useStreamAssistant() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const [rawResponse, setRawResponse] = useState('')
  const [streamState, setStreamState] = useState<StreamState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [proposedActions, setProposedActions] =
    useState<ProposedActions | null>(null)
  const abortRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.()
    }
  }, [])

  const { textResponse } = parseStreamResponse(rawResponse)

  const streamMessage = useCallback(
    async (message: string) => {
      if (!user?.id) {
        setError('User not authenticated')
        setStreamState('error')
        return
      }

      abortRef.current?.()

      setStreamState('streaming')
      setRawResponse('')
      setError(null)
      setProposedActions(null)

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
            setRawResponse((prev) => prev + chunk)
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

  useEffect(() => {
    if (streamState === 'idle' && rawResponse) {
      const { proposedActions: parsed } = parseStreamResponse(rawResponse)
      if (parsed) {
        setProposedActions(parsed)
      }
    }
  }, [streamState, rawResponse])

  const reset = useCallback(() => {
    abortRef.current?.()
    abortRef.current = null
    setRawResponse('')
    setStreamState('idle')
    setError(null)
    setProposedActions(null)
  }, [])

  const clearProposedActions = useCallback(() => {
    setProposedActions(null)
  }, [])

  return {
    response: textResponse,
    isStreaming: streamState === 'streaming',
    error,
    proposedActions,
    streamMessage,
    reset,
    clearProposedActions,
  }
}
