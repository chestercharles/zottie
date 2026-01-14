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

interface ErrorResponse {
  success: boolean
  error: string
}

async function createPantryItem(
  userId: string,
  name: string,
  status = 'in_stock'
) {
  const token = await createTestToken({
    userId,
    email: `${userId}@example.com`,
  })
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

describe('PATCH /api/pantry-items/:id', () => {
  it('should return 401 when no authorization header is provided', async () => {
    const response = await fetch(`${API_URL}/api/pantry-items/some-fake-id`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'running_low',
      }),
    })

    expect(response.status).toBe(401)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('Missing or invalid Authorization header')
  })

  it('should update a pantry item with valid JWT token', async () => {
    const userId = 'auth0|test-user-update-123'
    const token = await createTestToken({
      userId,
      email: `${userId}@example.com`,
    })

    const item = await createPantryItem(userId, 'Milk', 'in_stock')

    await new Promise((resolve) => setTimeout(resolve, 10))

    const response = await fetch(`${API_URL}/api/pantry-items/${item.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: 'running_low',
      }),
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as PantryItemResponse
    expect(data.success).toBe(true)
    expect(data.result.pantryItem).toBeDefined()
    expect(data.result.pantryItem.id).toBe(item.id)
    expect(data.result.pantryItem.name).toBe('Milk')
    expect(data.result.pantryItem.status).toBe('running_low')
    expect(data.result.pantryItem.userId).toBe(userId)
    expect(data.result.pantryItem.updatedAt).toBeDefined()
    expect(typeof data.result.pantryItem.updatedAt).toBe('number')
  })

  it('should return 404 when pantry item does not exist', async () => {
    const userId = 'auth0|test-user-update-456'
    const token = await createTestToken({
      userId,
      email: `${userId}@example.com`,
    })

    const response = await fetch(
      `${API_URL}/api/pantry-items/non-existent-id`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'running_low',
        }),
      }
    )

    expect(response.status).toBe(404)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('Pantry item not found')
  })

  it('should return 404 when pantry item belongs to another user', async () => {
    const userId1 = 'auth0|test-user-update-789'
    const userId2 = 'auth0|test-user-update-999'

    const item = await createPantryItem(userId1, 'Bread')

    const token2 = await createTestToken({
      userId: userId2,
      email: `${userId2}@example.com`,
    })
    const response = await fetch(`${API_URL}/api/pantry-items/${item.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({
        status: 'running_low',
      }),
    })

    expect(response.status).toBe(404)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('Pantry item not found')
  })

  it('should reject invalid status values', async () => {
    const userId = 'auth0|test-user-update-invalid'
    const token = await createTestToken({
      userId,
      email: `${userId}@example.com`,
    })

    const item = await createPantryItem(userId, 'Cheese')

    const response = await fetch(`${API_URL}/api/pantry-items/${item.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: 'invalid_status',
      }),
    })

    expect(response.status).toBe(400)
  })

  it('should update status to out_of_stock', async () => {
    const userId = 'auth0|test-user-update-oos'
    const token = await createTestToken({
      userId,
      email: `${userId}@example.com`,
    })

    const item = await createPantryItem(userId, 'Eggs', 'in_stock')

    const response = await fetch(`${API_URL}/api/pantry-items/${item.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: 'out_of_stock',
      }),
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as PantryItemResponse
    expect(data.success).toBe(true)
    expect(data.result.pantryItem.status).toBe('out_of_stock')
  })

  it('should update item name only', async () => {
    const userId = 'auth0|test-user-update-name'
    const token = await createTestToken({
      userId,
      email: `${userId}@example.com`,
    })

    const item = await createPantryItem(userId, 'Milk', 'in_stock')

    const response = await fetch(`${API_URL}/api/pantry-items/${item.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Oat Milk',
      }),
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as PantryItemResponse
    expect(data.success).toBe(true)
    expect(data.result.pantryItem.name).toBe('Oat Milk')
    expect(data.result.pantryItem.status).toBe('in_stock')
  })

  it('should update both name and status', async () => {
    const userId = 'auth0|test-user-update-both'
    const token = await createTestToken({
      userId,
      email: `${userId}@example.com`,
    })

    const item = await createPantryItem(userId, 'Butter', 'in_stock')

    const response = await fetch(`${API_URL}/api/pantry-items/${item.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Unsalted Butter',
        status: 'running_low',
      }),
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as PantryItemResponse
    expect(data.success).toBe(true)
    expect(data.result.pantryItem.name).toBe('Unsalted Butter')
    expect(data.result.pantryItem.status).toBe('running_low')
  })
})
