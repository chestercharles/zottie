import type {
  CreateGotoRequest,
  CreateGotoResponse,
  DeleteGotoResponse,
  ListGotosResponse,
  Goto,
  UpdateGotoRequest,
  UpdateGotoResponse,
} from './types'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787'

export async function createGoto(
  data: CreateGotoRequest,
  authToken: string,
  userId: string
): Promise<Goto> {
  const response = await fetch(`${API_BASE_URL}/api/gotos`, {
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
      .catch(() => ({ error: 'Failed to create go-to' }))
    throw new Error(error.error || 'Failed to create go-to')
  }

  const result = (await response.json()) as CreateGotoResponse
  return result.result.goto
}

export async function listGotos(
  authToken: string,
  userId: string
): Promise<Goto[]> {
  const response = await fetch(`${API_BASE_URL}/api/gotos`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'X-User-Id': userId,
    },
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to fetch go-tos' }))
    throw new Error(error.error || 'Failed to fetch go-tos')
  }

  const result = (await response.json()) as ListGotosResponse
  return result.result.gotos
}

export async function updateGoto(
  gotoId: string,
  data: UpdateGotoRequest,
  authToken: string,
  userId: string
): Promise<Goto> {
  const response = await fetch(`${API_BASE_URL}/api/gotos/${gotoId}`, {
    method: 'PATCH',
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
      .catch(() => ({ error: 'Failed to update go-to' }))
    throw new Error(error.error || 'Failed to update go-to')
  }

  const result = (await response.json()) as UpdateGotoResponse
  return result.result.goto
}

export async function deleteGoto(
  gotoId: string,
  authToken: string,
  userId: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/gotos/${gotoId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'X-User-Id': userId,
    },
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to delete go-to' }))
    throw new Error(error.error || 'Failed to delete go-to')
  }
}
