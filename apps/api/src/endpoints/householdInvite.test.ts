import { describe, it, expect } from 'vitest'
import { createTestToken } from '../test-utils/jwt'

const API_URL = 'http://localhost:8787'

interface HouseholdInviteResponse {
  success: boolean
  result: {
    invite: {
      id: string
      householdId: string
      code: string
      createdBy: string
      expiresAt: number
      createdAt: number
    }
  }
}

interface HouseholdInviteInfoResponse {
  success: boolean
  result: {
    invite: {
      code: string
      householdName: string
      expiresAt: number
    }
  }
}

interface ErrorResponse {
  success: boolean
  error: string
}

describe('POST /api/household/invite', () => {
  it('should return 401 when no authorization header is provided', async () => {
    const response = await fetch(`${API_URL}/api/household/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    expect(response.status).toBe(401)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('Missing or invalid Authorization header')
  })

  it('should create an invite for authenticated user with household', async () => {
    const userId = `auth0|invite-test-${Date.now()}`
    const token = await createTestToken({ userId })

    await fetch(`${API_URL}/api/household`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const response = await fetch(`${API_URL}/api/household/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as HouseholdInviteResponse
    expect(data.success).toBe(true)
    expect(data.result.invite).toBeDefined()
    expect(data.result.invite.code).toBeDefined()
    expect(data.result.invite.code.length).toBe(8)
    expect(data.result.invite.createdBy).toBe(userId)
    expect(data.result.invite.expiresAt).toBeGreaterThan(Date.now())
  })

  it('should invalidate previous invite when creating a new one', async () => {
    const userId = `auth0|invite-invalidate-${Date.now()}`
    const token = await createTestToken({ userId })

    await fetch(`${API_URL}/api/household`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const firstResponse = await fetch(`${API_URL}/api/household/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    const firstData = (await firstResponse.json()) as HouseholdInviteResponse
    const firstCode = firstData.result.invite.code

    const secondResponse = await fetch(`${API_URL}/api/household/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    const secondData = (await secondResponse.json()) as HouseholdInviteResponse
    const secondCode = secondData.result.invite.code

    expect(firstCode).not.toBe(secondCode)

    const validateFirstResponse = await fetch(
      `${API_URL}/api/household/invite/${firstCode}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    expect(validateFirstResponse.status).toBe(404)
  })
})

describe('GET /api/household/invite/:code', () => {
  it('should return 401 when no authorization header is provided', async () => {
    const response = await fetch(`${API_URL}/api/household/invite/testcode`, {
      method: 'GET',
    })

    expect(response.status).toBe(401)
  })

  it('should return 404 for invalid invite code', async () => {
    const userId = 'auth0|validate-test-123'
    const token = await createTestToken({ userId })

    const response = await fetch(
      `${API_URL}/api/household/invite/invalidcode`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    expect(response.status).toBe(404)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invite not found or expired')
  })

  it('should return invite info for valid code', async () => {
    const userId = `auth0|validate-valid-${Date.now()}`
    const token = await createTestToken({ userId })

    await fetch(`${API_URL}/api/household`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const createResponse = await fetch(`${API_URL}/api/household/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    const createData = (await createResponse.json()) as HouseholdInviteResponse
    const code = createData.result.invite.code

    const validateResponse = await fetch(
      `${API_URL}/api/household/invite/${code}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    expect(validateResponse.status).toBe(200)
    const data = (await validateResponse.json()) as HouseholdInviteInfoResponse
    expect(data.success).toBe(true)
    expect(data.result.invite.code).toBe(code)
    expect(data.result.invite.householdName).toBe('My Household')
    expect(data.result.invite.expiresAt).toBeGreaterThan(Date.now())
  })
})
