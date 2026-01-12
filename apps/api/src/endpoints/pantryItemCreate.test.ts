import { describe, it, expect } from 'vitest'

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

describe('POST /api/pantry-items', () => {
  it('should return 401 when no user ID is provided', async () => {
    const response = await fetch(`${API_URL}/api/pantry-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Milk',
      }),
    })

    expect(response.status).toBe(401)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized: No user ID provided')
  })

  it('should create a pantry item with valid user ID', async () => {
    const userId = 'auth0|test-user-123'
    const response = await fetch(`${API_URL}/api/pantry-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify({
        name: 'Milk',
      }),
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as PantryItemResponse
    expect(data.success).toBe(true)
    expect(data.result.pantryItem).toBeDefined()
    expect(data.result.pantryItem.name).toBe('Milk')
    expect(data.result.pantryItem.status).toBe('in_stock')
    expect(data.result.pantryItem.userId).toBe(userId)
    expect(data.result.pantryItem.id).toBeDefined()
    expect(data.result.pantryItem.createdAt).toBeDefined()
    expect(data.result.pantryItem.updatedAt).toBeDefined()
  })

  it('should create a pantry item with custom status', async () => {
    const userId = 'auth0|test-user-123'
    const response = await fetch(`${API_URL}/api/pantry-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify({
        name: 'Eggs',
        status: 'running_low',
      }),
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as PantryItemResponse
    expect(data.success).toBe(true)
    expect(data.result.pantryItem.name).toBe('Eggs')
    expect(data.result.pantryItem.status).toBe('running_low')
  })

  it('should reject invalid status values', async () => {
    const userId = 'auth0|test-user-123'
    const response = await fetch(`${API_URL}/api/pantry-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify({
        name: 'Bread',
        status: 'invalid_status',
      }),
    })

    // chanfana returns 400 for validation errors
    expect(response.status).toBe(400)
  })

  it('should require name field', async () => {
    const userId = 'auth0|test-user-123'
    const response = await fetch(`${API_URL}/api/pantry-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify({}),
    })

    expect(response.status).toBe(400)
  })
})
