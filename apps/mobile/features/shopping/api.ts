import type { ListPantryItemsResponse, ShoppingItem, PantryItemStatus, PantryItem } from './types'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787'

interface CreatePantryItemResponse {
  success: boolean
  result: {
    pantryItem: PantryItem
  }
}

async function updateItemStatus(
  itemId: string,
  status: PantryItemStatus,
  authToken: string,
  userId: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/pantry-items/${itemId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      'X-User-Id': userId,
    },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to update item status' }))
    throw new Error(error.error || 'Failed to update item status')
  }
}

export async function markItemsAsPurchased(
  itemIds: string[],
  authToken: string,
  userId: string
): Promise<void> {
  await Promise.all(
    itemIds.map((id) => updateItemStatus(id, 'in_stock', authToken, userId))
  )
}

export async function createPlannedItem(
  name: string,
  authToken: string,
  userId: string
): Promise<ShoppingItem> {
  const response = await fetch(`${API_BASE_URL}/api/pantry-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      'X-User-Id': userId,
    },
    body: JSON.stringify({
      name,
      status: 'planned',
      itemType: 'planned',
    }),
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to create planned item' }))
    throw new Error(error.error || 'Failed to create planned item')
  }

  const result = (await response.json()) as CreatePantryItemResponse
  return {
    ...result.result.pantryItem,
    itemType: result.result.pantryItem.itemType,
  }
}

export async function getShoppingItems(
  authToken: string,
  userId: string
): Promise<ShoppingItem[]> {
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
      .catch(() => ({ error: 'Failed to fetch shopping items' }))
    throw new Error(error.error || 'Failed to fetch shopping items')
  }

  const result = (await response.json()) as ListPantryItemsResponse

  return result.result.pantryItems
    .filter(
      (item) =>
        item.status === 'running_low' ||
        item.status === 'out_of_stock' ||
        item.status === 'planned'
    )
    .map((item) => ({
      ...item,
      itemType: item.itemType,
    }))
}
