import { describe, it, expect, beforeAll } from 'vitest'

const API_URL = 'http://localhost:8787'

interface PantryItemListResponse {
  success: boolean
  result: {
    pantryItems: Array<{
      id: string
      userId: string
      name: string
      status: string
      createdAt: number
      updatedAt: number
    }>
  }
}

interface ErrorResponse {
  success: boolean
  error: string
}

describe('GET /api/pantry-items', () => {
  const testUserId = 'auth0|list-test-user-' + Date.now()

  beforeAll(async () => {
    await fetch(`${API_URL}/api/pantry-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': testUserId,
      },
      body: JSON.stringify({ name: 'Test Item 1', status: 'in_stock' }),
    })
    await fetch(`${API_URL}/api/pantry-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': testUserId,
      },
      body: JSON.stringify({ name: 'Test Item 2', status: 'running_low' }),
    })
  })

  it('should return 401 when no user ID is provided', async () => {
    const response = await fetch(`${API_URL}/api/pantry-items`, {
      method: 'GET',
    })

    expect(response.status).toBe(401)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized: No user ID provided')
  })

  it('should return empty array for user with no items', async () => {
    const response = await fetch(`${API_URL}/api/pantry-items`, {
      method: 'GET',
      headers: {
        'X-User-Id': 'auth0|user-with-no-items-' + Date.now(),
      },
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as PantryItemListResponse
    expect(data.success).toBe(true)
    expect(data.result.pantryItems).toEqual([])
  })

  it('should return pantry items for the authenticated user', async () => {
    const response = await fetch(`${API_URL}/api/pantry-items`, {
      method: 'GET',
      headers: {
        'X-User-Id': testUserId,
      },
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as PantryItemListResponse
    expect(data.success).toBe(true)
    expect(data.result.pantryItems.length).toBeGreaterThanOrEqual(2)

    const itemNames = data.result.pantryItems.map((item) => item.name)
    expect(itemNames).toContain('Test Item 1')
    expect(itemNames).toContain('Test Item 2')
  })

  it('should only return items for the specific user', async () => {
    const differentUserId = 'auth0|different-user-' + Date.now()

    await fetch(`${API_URL}/api/pantry-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': differentUserId,
      },
      body: JSON.stringify({ name: 'Different User Item' }),
    })

    const response = await fetch(`${API_URL}/api/pantry-items`, {
      method: 'GET',
      headers: {
        'X-User-Id': differentUserId,
      },
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as PantryItemListResponse
    expect(data.success).toBe(true)

    const allItemsBelongToUser = data.result.pantryItems.every(
      (item) => item.userId === differentUserId
    )
    expect(allItemsBelongToUser).toBe(true)
    expect(data.result.pantryItems.some((item) => item.name === 'Test Item 1')).toBe(false)
  })

  it('should return items with correct structure', async () => {
    const response = await fetch(`${API_URL}/api/pantry-items`, {
      method: 'GET',
      headers: {
        'X-User-Id': testUserId,
      },
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as PantryItemListResponse
    const item = data.result.pantryItems[0]

    expect(item).toHaveProperty('id')
    expect(item).toHaveProperty('userId')
    expect(item).toHaveProperty('name')
    expect(item).toHaveProperty('status')
    expect(item).toHaveProperty('createdAt')
    expect(item).toHaveProperty('updatedAt')
    expect(typeof item.createdAt).toBe('number')
    expect(typeof item.updatedAt).toBe('number')
  })
})
