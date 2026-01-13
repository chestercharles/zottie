import { describe, it, expect, beforeAll } from 'vitest'
import { createTestToken } from '../test-utils/jwt'

const API_URL = 'http://localhost:8787'

interface PantryItemListResponse {
  success: boolean
  result: {
    pantryItems: Array<{
      id: string
      userId: string
      householdId: string
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
  let testUserToken: string

  beforeAll(async () => {
    testUserToken = await createTestToken({ userId: testUserId, email: `${testUserId}@example.com` })

    await fetch(`${API_URL}/api/pantry-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({ name: 'Test Item 1', status: 'in_stock' }),
    })
    await fetch(`${API_URL}/api/pantry-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({ name: 'Test Item 2', status: 'running_low' }),
    })
  })

  it('should return 401 when no authorization header is provided', async () => {
    const response = await fetch(`${API_URL}/api/pantry-items`, {
      method: 'GET',
    })

    expect(response.status).toBe(401)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('Missing or invalid Authorization header')
  })

  it('should return empty array for user with no items', async () => {
    const emptyUserId = 'auth0|user-with-no-items-' + Date.now()
    const token = await createTestToken({ userId: emptyUserId, email: `${emptyUserId}@example.com` })
    const response = await fetch(`${API_URL}/api/pantry-items`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
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
        Authorization: `Bearer ${testUserToken}`,
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
    const differentUserToken = await createTestToken({ userId: differentUserId, email: `${differentUserId}@example.com` })

    await fetch(`${API_URL}/api/pantry-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${differentUserToken}`,
      },
      body: JSON.stringify({ name: 'Different User Item' }),
    })

    const response = await fetch(`${API_URL}/api/pantry-items`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${differentUserToken}`,
      },
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as PantryItemListResponse
    expect(data.success).toBe(true)

    const allItemsBelongToUser = data.result.pantryItems.every(
      (item) => item.userId === differentUserId
    )
    expect(allItemsBelongToUser).toBe(true)

    const householdIds = new Set(data.result.pantryItems.map((item) => item.householdId))
    expect(householdIds.size).toBe(1)
    expect(data.result.pantryItems.some((item) => item.name === 'Test Item 1')).toBe(false)
  })

  it('should return items with correct structure', async () => {
    const response = await fetch(`${API_URL}/api/pantry-items`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${testUserToken}`,
      },
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as PantryItemListResponse
    const item = data.result.pantryItems[0]

    expect(item).toHaveProperty('id')
    expect(item).toHaveProperty('userId')
    expect(item).toHaveProperty('householdId')
    expect(item).toHaveProperty('name')
    expect(item).toHaveProperty('status')
    expect(item).toHaveProperty('createdAt')
    expect(item).toHaveProperty('updatedAt')
    expect(typeof item.createdAt).toBe('number')
    expect(typeof item.updatedAt).toBe('number')
  })
})
