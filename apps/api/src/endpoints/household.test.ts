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
      email: string
      name?: string
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

  it('should return 404 when user has no household', async () => {
    const userId = `auth0|no-household-get-${Date.now()}`
    const token = await createTestToken({ userId, email: 'test@example.com' })

    const response = await fetch(`${API_URL}/api/household`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status).toBe(404)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('No household membership found')
  })

  it('should return existing household for user with household', async () => {
    const userId = `auth0|existing-household-${Date.now()}`
    const token = await createTestToken({
      userId,
      email: `${userId}@example.com`,
    })

    const createResponse = await fetch(`${API_URL}/api/household`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Test Household' }),
    })
    const createData = (await createResponse.json()) as HouseholdResponse
    const householdId = createData.result.household.id

    const getResponse = await fetch(`${API_URL}/api/household`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(getResponse.status).toBe(200)
    const getData = (await getResponse.json()) as HouseholdResponse
    expect(getData.result.household.id).toBe(householdId)
    expect(getData.result.household.name).toBe('Test Household')
    expect(getData.result.members.length).toBe(1)
  })
})

describe('POST /api/household', () => {
  it('should return 401 when no authorization header is provided', async () => {
    const response = await fetch(`${API_URL}/api/household`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Test Household' }),
    })

    expect(response.status).toBe(401)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('Missing or invalid Authorization header')
  })

  it('should create a new household with provided name', async () => {
    const userId = `auth0|create-household-${Date.now()}`
    const token = await createTestToken({
      userId,
      email: `${userId}@example.com`,
    })

    const response = await fetch(`${API_URL}/api/household`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'My New Home' }),
    })

    expect(response.status).toBe(201)
    const data = (await response.json()) as HouseholdResponse
    expect(data.success).toBe(true)
    expect(data.result.household.name).toBe('My New Home')
    expect(data.result.household.id).toBeDefined()
    expect(data.result.members.length).toBe(1)
    expect(data.result.members[0].userId).toBe(userId)
  })

  it('should return 409 when user already has a household', async () => {
    const userId = `auth0|duplicate-household-${Date.now()}`
    const token = await createTestToken({
      userId,
      email: `${userId}@example.com`,
    })

    await fetch(`${API_URL}/api/household`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'First Household' }),
    })

    const response = await fetch(`${API_URL}/api/household`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Second Household' }),
    })

    expect(response.status).toBe(409)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('User already belongs to a household')
  })
})

describe('GET /api/household/membership', () => {
  it('should return 401 when no authorization header is provided', async () => {
    const response = await fetch(`${API_URL}/api/household/membership`)

    expect(response.status).toBe(401)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('Missing or invalid Authorization header')
  })

  it('should return 404 when user has no household', async () => {
    const userId = `auth0|no-membership-${Date.now()}`
    const token = await createTestToken({
      userId,
      email: `${userId}@example.com`,
    })

    const response = await fetch(`${API_URL}/api/household/membership`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status).toBe(404)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('No household membership found')
  })

  it('should return household membership when user has a household', async () => {
    const userId = `auth0|has-membership-${Date.now()}`
    const token = await createTestToken({
      userId,
      email: `${userId}@example.com`,
    })

    await fetch(`${API_URL}/api/household`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Membership Test Household' }),
    })

    const response = await fetch(`${API_URL}/api/household/membership`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as HouseholdResponse
    expect(data.success).toBe(true)
    expect(data.result.household.name).toBe('Membership Test Household')
    expect(data.result.members.length).toBe(1)
    expect(data.result.members[0].userId).toBe(userId)
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
    const userId = `auth0|no-household-patch-${Date.now()}`
    const token = await createTestToken({
      userId,
      email: `${userId}@example.com`,
    })

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
    const token = await createTestToken({
      userId,
      email: `${userId}@example.com`,
    })

    await fetch(`${API_URL}/api/household`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Original Name' }),
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
    const token = await createTestToken({
      userId,
      email: `${userId}@example.com`,
    })

    await fetch(`${API_URL}/api/household`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Initial Name' }),
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
