import type { ProposedAction, ProposedActions } from './hooks'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787'

export type ConversationMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  proposedActions: ProposedActions | null
  createdAt: string
}

export type Conversation = {
  id: string
  createdAt: string
  updatedAt: string
  messages: ConversationMessage[]
}

export async function getAssistantConversation(
  authToken: string,
  userId: string
): Promise<Conversation | null> {
  const response = await fetch(`${API_BASE_URL}/api/assistant/conversation`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'X-User-Id': userId,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      (errorData as { error?: string }).error || 'Failed to get conversation'
    )
  }

  const data = (await response.json()) as {
    success: boolean
    conversation: Conversation | null
  }
  return data.conversation
}

export async function deleteAssistantConversation(
  authToken: string,
  userId: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/assistant/conversation`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'X-User-Id': userId,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      (errorData as { error?: string }).error || 'Failed to delete conversation'
    )
  }
}

export async function executeAssistantActions(
  actions: ProposedAction[],
  authToken: string,
  userId: string
): Promise<{ executed: number; failed: number }> {
  const response = await fetch(`${API_BASE_URL}/api/commands/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      'X-User-Id': userId,
    },
    body: JSON.stringify({ actions }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      (errorData as { error?: string }).error || 'Failed to execute actions'
    )
  }

  const data = (await response.json()) as {
    success: boolean
    result: { executed: number; failed: number }
  }
  return data.result
}

export function streamAssistantChat(
  message: string,
  authToken: string,
  userId: string,
  conversationId: string | null,
  onChunk: (text: string) => void,
  onConversationId: (id: string) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): () => void {
  const xhr = new XMLHttpRequest()
  let lastIndex = 0
  let conversationIdExtracted = false

  xhr.open('POST', `${API_BASE_URL}/api/assistant/chat`)
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.setRequestHeader('Authorization', `Bearer ${authToken}`)
  xhr.setRequestHeader('X-User-Id', userId)

  const processChunk = (text: string) => {
    if (!conversationIdExtracted && text.includes('[CONVERSATION_ID]')) {
      const match = text.match(/\[CONVERSATION_ID\]([^\n]+)\n/)
      if (match) {
        onConversationId(match[1])
        conversationIdExtracted = true
        text = text.replace(/\[CONVERSATION_ID\][^\n]+\n/, '')
      }
    }
    if (text) {
      onChunk(text)
    }
  }

  xhr.onprogress = () => {
    const newText = xhr.responseText.slice(lastIndex)
    lastIndex = xhr.responseText.length
    if (newText) {
      processChunk(newText)
    }
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const remaining = xhr.responseText.slice(lastIndex)
      if (remaining) {
        processChunk(remaining)
      }
      onComplete()
    } else {
      try {
        const errorData = JSON.parse(xhr.responseText)
        onError(new Error(errorData.error || 'Failed to get assistant response'))
      } catch {
        onError(new Error('Failed to get assistant response'))
      }
    }
  }

  xhr.onerror = () => {
    onError(new Error('Network error'))
  }

  const body: { message: string; conversationId?: string } = { message }
  if (conversationId) {
    body.conversationId = conversationId
  }
  xhr.send(JSON.stringify(body))

  return () => xhr.abort()
}
