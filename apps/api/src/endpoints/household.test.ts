import { describe, it, expect } from 'vitest'
import { createTestToken } from '../test-utils/jwt'

const API_URL = 'http://localhost:8787'

interface HouseholdResponse {
  success: boolean
  result: {
    household: {
      id: string
      name: string
      createdAt: number
      updatedAt: number
    }
    members: Array<{
      id: string
      householdId: string
      userId: string
      joinedAt: number
    }>
  }
}

interface HouseholdUpdateResponse {
  success: boolean
  result: {
    household: {
      id: string
      name: string
      createdAt: number
      updatedAt: number
    }
  }
}

interface ErrorResponse {
  success: boolean
  error: string
}

describe('GET /api/household', () => {
  it('should return 401 when no authorization header is provided', async () => {
    const response = await fetch(`${API_URL}/api/household`)

    expect(response.status).toBe(401)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('Missing or invalid Authorization header')
  })

  it('should create a new household for a new user', async () => {
    const userId = `auth0|new-household-${Date.now()}`
    const token = await createTestToken({ userId })

    const response = await fetch(`${API_URL}/api/household`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as HouseholdResponse
    expect(data.success).toBe(true)
    expect(data.result.household.name).toBe('My Household')
    expect(data.result.household.id).toBeDefined()
    expect(data.result.members.length).toBe(1)
    expect(data.result.members[0].userId).toBe(userId)
  })

  it('should return existing household for user with household', async () => {
    const userId = `auth0|existing-household-${Date.now()}`
    const token = await createTestToken({ userId })

    const firstResponse = await fetch(`${API_URL}/api/household`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const firstData = (await firstResponse.json()) as HouseholdResponse
    const householdId = firstData.result.household.id

    const secondResponse = await fetch(`${API_URL}/api/household`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(secondResponse.status).toBe(200)
    const secondData = (await secondResponse.json()) as HouseholdResponse
    expect(secondData.result.household.id).toBe(householdId)
    expect(secondData.result.members.length).toBe(1)
  })
})

describe('PATCH /api/household', () => {
  it('should return 401 when no authorization header is provided', async () => {
    const response = await fetch(`${API_URL}/api/household`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'New Name' }),
    })

    expect(response.status).toBe(401)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('Missing or invalid Authorization header')
  })

  it('should return 404 when user has no household', async () => {
    const userId = `auth0|no-household-${Date.now()}`
    const token = await createTestToken({ userId })

    const response = await fetch(`${API_URL}/api/household`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'New Name' }),
    })

    expect(response.status).toBe(404)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('Household not found')
  })

  it('should update household name successfully', async () => {
    const userId = `auth0|update-household-${Date.now()}`
    const token = await createTestToken({ userId })

    await fetch(`${API_URL}/api/household`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const response = await fetch(`${API_URL}/api/household`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Updated Household Name' }),
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as HouseholdUpdateResponse
    expect(data.success).toBe(true)
    expect(data.result.household.name).toBe('Updated Household Name')
  })

  it('should persist updated household name', async () => {
    const userId = `auth0|persist-update-${Date.now()}`
    const token = await createTestToken({ userId })

    await fetch(`${API_URL}/api/household`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    await fetch(`${API_URL}/api/household`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Persistent Name' }),
    })

    const getResponse = await fetch(`${API_URL}/api/household`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(getResponse.status).toBe(200)
    const data = (await getResponse.json()) as HouseholdResponse
    expect(data.result.household.name).toBe('Persistent Name')
  })
})
