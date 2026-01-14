import type {
  CommandParseRequest,
  CommandParseResponse,
  CommandExecuteRequest,
  CommandExecuteResponse,
} from './types'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787'

export async function parseCommand(
  data: CommandParseRequest,
  authToken: string,
  userId: string
): Promise<CommandParseResponse> {
  const response = await fetch(`${API_BASE_URL}/api/commands/parse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      'X-User-Id': userId,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to parse command' }))
    throw new Error(error.error || 'Failed to parse command')
  }

  return (await response.json()) as CommandParseResponse
}

export async function executeCommand(
  data: CommandExecuteRequest,
  authToken: string,
  userId: string
): Promise<CommandExecuteResponse> {
  const response = await fetch(`${API_BASE_URL}/api/commands/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      'X-User-Id': userId,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to execute command' }))
    throw new Error(error.error || 'Failed to execute command')
  }

  return (await response.json()) as CommandExecuteResponse
}
