import type {
  CreatePantryItemRequest,
  CreatePantryItemResponse,
  ListPantryItemsResponse,
  PantryItem,
  UpdatePantryItemRequest,
  UpdatePantryItemResponse,
} from './types'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787'

export async function createPantryItem(
  data: CreatePantryItemRequest,
  authToken: string,
  userId: string
): Promise<PantryItem> {
  const response = await fetch(`${API_BASE_URL}/api/pantry-items`, {
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
      .catch(() => ({ error: 'Failed to create pantry item' }))
    throw new Error(error.error || 'Failed to create pantry item')
  }

  const result = (await response.json()) as CreatePantryItemResponse
  return result.result.pantryItem
}

export async function listPantryItems(
  authToken: string,
  userId: string
): Promise<PantryItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/pantry-items`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'X-User-Id': userId,
    },
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to fetch pantry items' }))
    throw new Error(error.error || 'Failed to fetch pantry items')
  }

  const result = (await response.json()) as ListPantryItemsResponse
  return result.result.pantryItems
}

export async function updatePantryItem(
  itemId: string,
  data: UpdatePantryItemRequest,
  authToken: string,
  userId: string
): Promise<PantryItem> {
  const response = await fetch(`${API_BASE_URL}/api/pantry-items/${itemId}`, {
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
      .catch(() => ({ error: 'Failed to update pantry item' }))
    throw new Error(error.error || 'Failed to update pantry item')
  }

  const result = (await response.json()) as UpdatePantryItemResponse
  return result.result.pantryItem
}
