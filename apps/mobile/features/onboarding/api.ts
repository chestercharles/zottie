import type { OnboardingFlagResponse } from './types'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787'

export async function getOnboardingFlag(
  authToken: string,
  userId: string
): Promise<OnboardingFlagResponse> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/flag`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'X-User-Id': userId,
    },
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to fetch onboarding flag' }))
    throw new Error(error.error || 'Failed to fetch onboarding flag')
  }

  return (await response.json()) as OnboardingFlagResponse
}
