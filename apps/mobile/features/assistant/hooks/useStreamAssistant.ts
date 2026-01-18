import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth0 } from 'react-native-auth0'
import { useAuth } from '@/features/auth'
import { streamAssistantChat, type HistoryMessage } from '../api'

export type ProposedAction = {
  type: 'add_to_pantry' | 'update_pantry_status'
  item: string
  status: 'in_stock' | 'running_low' | 'out_of_stock' | 'planned'
}

export type ProposedActions = {
  actions: ProposedAction[]
  summary: string
}

export type TextMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export type ActionResultMessage = {
  id: string
  role: 'action_result'
  actions: ProposedAction[]
  summary: string
  outcome: 'confirmed' | 'cancelled' | 'error'
  resultMessage?: string
}

export type Message = TextMessage | ActionResultMessage

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
    return { textResponse, proposedActions: null }
  }
}

export function useStreamAssistant() {
  const { user } = useAuth()
  const { getCredentials } = useAuth0()
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingResponse, setStreamingResponse] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proposedActions, setProposedActions] =
    useState<ProposedActions | null>(null)
  const abortRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.()
    }
  }, [])

  const displayText = parseStreamResponse(streamingResponse).textResponse

  const streamMessage = useCallback(
    async (message: string) => {
      if (!user?.id) {
        setError('User not authenticated')
        return
      }

      abortRef.current?.()

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
      }

      setMessages((prev) => [...prev, userMessage])
      setIsStreaming(true)
      setStreamingResponse('')
      setError(null)
      setProposedActions(null)

      try {
        const credentials = await getCredentials()
        if (!credentials?.accessToken) {
          throw new Error('No access token available')
        }

        const history: HistoryMessage[] = messages
          .filter((msg): msg is TextMessage => msg.role !== 'action_result')
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))

        let fullResponse = ''
        abortRef.current = streamAssistantChat(
          message,
          credentials.accessToken,
          user.id,
          history,
          (chunk) => {
            fullResponse += chunk
            setStreamingResponse(fullResponse)
          },
          (err) => {
            setError(err.message)
            setIsStreaming(false)
            abortRef.current = null
          },
          () => {
            const { textResponse, proposedActions: parsed } =
              parseStreamResponse(fullResponse)

            if (textResponse) {
              const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: textResponse,
              }
              setMessages((prev) => [...prev, assistantMessage])
            }

            setStreamingResponse('')
            setProposedActions(parsed)
            setIsStreaming(false)
            abortRef.current = null
          }
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setIsStreaming(false)
      }
    },
    [user?.id, getCredentials, messages]
  )


  const reset = useCallback(() => {
    abortRef.current?.()
    abortRef.current = null
    setMessages([])
    setStreamingResponse('')
    setIsStreaming(false)
    setError(null)
    setProposedActions(null)
  }, [])

  const clearProposedActions = useCallback(() => {
    setProposedActions(null)
  }, [])

  const addActionResult = useCallback(
    (
      actions: ProposedAction[],
      summary: string,
      outcome: 'confirmed' | 'cancelled' | 'error',
      resultMessage?: string
    ) => {
      const actionResultMessage: ActionResultMessage = {
        id: `action-result-${Date.now()}`,
        role: 'action_result',
        actions,
        summary,
        outcome,
        resultMessage,
      }
      setMessages((prev) => [...prev, actionResultMessage])
      setProposedActions(null)
    },
    []
  )

  return {
    messages,
    streamingResponse: displayText,
    isStreaming,
    error,
    proposedActions,
    streamMessage,
    reset,
    clearProposedActions,
    addActionResult,
  }
}
