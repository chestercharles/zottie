const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787'

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
