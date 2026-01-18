import type { ProposedAction } from './hooks'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787'

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
  onChunk: (text: string) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): () => void {
  const xhr = new XMLHttpRequest()
  let lastIndex = 0

  xhr.open('POST', `${API_BASE_URL}/api/assistant/chat`)
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.setRequestHeader('Authorization', `Bearer ${authToken}`)
  xhr.setRequestHeader('X-User-Id', userId)

  xhr.onprogress = () => {
    const newText = xhr.responseText.slice(lastIndex)
    lastIndex = xhr.responseText.length
    if (newText) {
      onChunk(newText)
    }
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const remaining = xhr.responseText.slice(lastIndex)
      if (remaining) {
        onChunk(remaining)
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

  xhr.send(JSON.stringify({ message }))

  return () => xhr.abort()
}
