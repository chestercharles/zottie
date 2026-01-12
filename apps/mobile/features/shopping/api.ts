import type { ListPantryItemsResponse, ShoppingItem } from './types'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787'

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
    .filter((item) => item.status === 'running_low' || item.status === 'out_of_stock')
    .map((item) => ({
      ...item,
      itemType: 'staple' as const,
    }))
}
