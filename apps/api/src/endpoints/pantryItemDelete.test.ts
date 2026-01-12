import { describe, it, expect } from 'vitest'
import { createTestToken } from '../test-utils/jwt'

const API_URL = 'http://localhost:8787'

interface PantryItemResponse {
  success: boolean
  result: {
    pantryItem: {
      id: string
      userId: string
      name: string
      status: string
      createdAt: number
      updatedAt: number
    }
  }
}

interface DeleteResponse {
  success: boolean
}

interface ErrorResponse {
  success: boolean
  error: string
}

async function createPantryItem(
  userId: string,
  name: string,
  status = 'in_stock'
) {
  const token = await createTestToken({ userId })
  const response = await fetch(`${API_URL}/api/pantry-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, status }),
  })
  const data = (await response.json()) as PantryItemResponse
  return data.result.pantryItem
}

describe('DELETE /api/pantry-items/:id', () => {
  it('should return 401 when no authorization header is provided', async () => {
    const response = await fetch(
      `${API_URL}/api/pantry-items/some-fake-id`,
      {
        method: 'DELETE',
      }
    )

    expect(response.status).toBe(401)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('Missing or invalid Authorization header')
  })

  it('should delete a pantry item with valid JWT token', async () => {
    const userId = 'auth0|test-user-delete-123'
    const token = await createTestToken({ userId })

    const item = await createPantryItem(userId, 'Milk to delete')

    const response = await fetch(`${API_URL}/api/pantry-items/${item.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as DeleteResponse
    expect(data.success).toBe(true)

    const getResponse = await fetch(`${API_URL}/api/pantry-items`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const listData = (await getResponse.json()) as {
      result: { pantryItems: { id: string }[] }
    }
    const deletedItem = listData.result.pantryItems.find(
      (i) => i.id === item.id
    )
    expect(deletedItem).toBeUndefined()
  })

  it('should return 404 when pantry item does not exist', async () => {
    const userId = 'auth0|test-user-delete-456'
    const token = await createTestToken({ userId })

    const response = await fetch(
      `${API_URL}/api/pantry-items/non-existent-id`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    expect(response.status).toBe(404)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('Pantry item not found')
  })

  it('should return 404 when pantry item belongs to another user', async () => {
    const userId1 = 'auth0|test-user-delete-789'
    const userId2 = 'auth0|test-user-delete-999'

    const item = await createPantryItem(userId1, 'Bread to keep')

    const token2 = await createTestToken({ userId: userId2 })
    const response = await fetch(`${API_URL}/api/pantry-items/${item.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token2}`,
      },
    })

    expect(response.status).toBe(404)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('Pantry item not found')

    const token1 = await createTestToken({ userId: userId1 })
    const verifyResponse = await fetch(`${API_URL}/api/pantry-items`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token1}`,
      },
    })
    const listData = (await verifyResponse.json()) as {
      result: { pantryItems: { id: string }[] }
    }
    const stillExists = listData.result.pantryItems.find((i) => i.id === item.id)
    expect(stillExists).toBeDefined()
  })
})
