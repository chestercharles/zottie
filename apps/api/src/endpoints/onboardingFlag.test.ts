import { describe, it, expect } from 'vitest'
import { createTestToken } from '../test-utils/jwt'

const API_URL = 'http://localhost:8787'

interface OnboardingFlagResponse {
  success: boolean
  result: {
    flag: 'original' | 'conversational'
  }
}

interface ErrorResponse {
  success: boolean
  error: string
}

describe('GET /api/onboarding/flag', () => {
  it('should return 401 when no authorization header is provided', async () => {
    const response = await fetch(`${API_URL}/api/onboarding/flag`)

    expect(response.status).toBe(401)
    const data = (await response.json()) as ErrorResponse
    expect(data.success).toBe(false)
    expect(data.error).toBe('Missing or invalid Authorization header')
  })

  it('should return the onboarding flag for authenticated user', async () => {
    const userId = `auth0|test-flag-${Date.now()}`
    const token = await createTestToken({ userId, email: 'test@example.com' })

    const response = await fetch(`${API_URL}/api/onboarding/flag`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as OnboardingFlagResponse
    expect(data.success).toBe(true)
    expect(data.result.flag).toBeDefined()
    expect(['original', 'conversational']).toContain(data.result.flag)
  })

  it('should return "original" flag by default', async () => {
    const userId = `auth0|test-flag-default-${Date.now()}`
    const token = await createTestToken({ userId, email: 'test@example.com' })

    const response = await fetch(`${API_URL}/api/onboarding/flag`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as OnboardingFlagResponse
    expect(data.success).toBe(true)
    expect(data.result.flag).toBe('original')
  })
})
