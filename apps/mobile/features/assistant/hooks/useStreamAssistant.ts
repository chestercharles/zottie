import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth0 } from 'react-native-auth0'
import { useAuth } from '@/features/auth'
import {
  streamAssistantChat,
  getAssistantConversation,
  deleteAssistantConversation,
  type ConversationMessage,
} from '../api'

type StreamState = 'idle' | 'streaming' | 'error' | 'loading'

export type ProposedAction = {
  type: 'add_to_pantry' | 'update_pantry_status'
  item: string
  status: 'in_stock' | 'running_low' | 'out_of_stock' | 'planned'
}

export type ProposedActions = {
  actions: ProposedAction[]
  summary: string
}

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  proposedActions: ProposedActions | null
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
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingResponse, setStreamingResponse] = useState('')
  const [streamState, setStreamState] = useState<StreamState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [proposedActions, setProposedActions] =
    useState<ProposedActions | null>(null)
  const abortRef = useRef<(() => void) | null>(null)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    return () => {
      abortRef.current?.()
    }
  }, [])

  const loadConversation = useCallback(async () => {
    if (!user?.id || hasLoadedRef.current) return

    hasLoadedRef.current = true
    setStreamState('loading')

    try {
      const credentials = await getCredentials()
      if (!credentials?.accessToken) {
        setStreamState('idle')
        return
      }

      const conversation = await getAssistantConversation(
        credentials.accessToken,
        user.id
      )

      if (conversation) {
        setConversationId(conversation.id)
        setMessages(
          conversation.messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            proposedActions: msg.proposedActions,
          }))
        )
      }
      setStreamState('idle')
    } catch {
      setStreamState('idle')
    }
  }, [user?.id, getCredentials])

  useEffect(() => {
    loadConversation()
  }, [loadConversation])

  const { textResponse: currentStreamText, proposedActions: streamProposedActions } =
    parseStreamResponse(streamingResponse)

  const streamMessage = useCallback(
    async (message: string) => {
      if (!user?.id) {
        setError('User not authenticated')
        setStreamState('error')
        return
      }

      abortRef.current?.()

      const userMessageId = `user-${Date.now()}`
      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        content: message,
        proposedActions: null,
      }
      setMessages((prev) => [...prev, userMessage])

      setStreamState('streaming')
      setStreamingResponse('')
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
          conversationId,
          (chunk) => {
            setStreamingResponse((prev) => prev + chunk)
          },
          (newConversationId) => {
            setConversationId(newConversationId)
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
    [user?.id, getCredentials, conversationId]
  )

  useEffect(() => {
    if (streamState === 'idle' && streamingResponse) {
      const { textResponse, proposedActions: parsed } =
        parseStreamResponse(streamingResponse)

      const assistantMessageId = `assistant-${Date.now()}`
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: textResponse,
        proposedActions: parsed,
      }
      setMessages((prev) => [...prev, assistantMessage])
      setStreamingResponse('')

      if (parsed) {
        setProposedActions(parsed)
      }
    }
  }, [streamState, streamingResponse])

  const reset = useCallback(async () => {
    abortRef.current?.()
    abortRef.current = null

    if (conversationId && user?.id) {
      try {
        const credentials = await getCredentials()
        if (credentials?.accessToken) {
          await deleteAssistantConversation(credentials.accessToken, user.id)
        }
      } catch {
        // Ignore errors during deletion
      }
    }

    setConversationId(null)
    setMessages([])
    setStreamingResponse('')
    setStreamState('idle')
    setError(null)
    setProposedActions(null)
  }, [conversationId, user?.id, getCredentials])

  const clearProposedActions = useCallback(() => {
    setProposedActions(null)
  }, [])

  return {
    messages,
    streamingResponse: currentStreamText,
    isStreaming: streamState === 'streaming',
    isLoading: streamState === 'loading',
    error,
    proposedActions,
    conversationId,
    streamMessage,
    reset,
    clearProposedActions,
  }
}
