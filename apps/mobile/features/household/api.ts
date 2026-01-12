import type {
  GetHouseholdResponse,
  Household,
  HouseholdInvite,
  HouseholdMember,
  UpdateHouseholdRequest,
  UpdateHouseholdResponse,
  CreateHouseholdInviteResponse,
} from './types'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787'

export async function getHousehold(
  authToken: string,
  userId: string
): Promise<{ household: Household; members: HouseholdMember[] }> {
  const response = await fetch(`${API_BASE_URL}/api/household`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'X-User-Id': userId,
    },
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to fetch household' }))
    throw new Error(error.error || 'Failed to fetch household')
  }

  const result = (await response.json()) as GetHouseholdResponse
  return result.result
}

export async function updateHousehold(
  data: UpdateHouseholdRequest,
  authToken: string,
  userId: string
): Promise<Household> {
  const response = await fetch(`${API_BASE_URL}/api/household`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      'X-User-Id': userId,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to update household' }))
    throw new Error(error.error || 'Failed to update household')
  }

  const result = (await response.json()) as UpdateHouseholdResponse
  return result.result.household
}

export async function createHouseholdInvite(
  authToken: string,
  userId: string
): Promise<HouseholdInvite> {
  const response = await fetch(`${API_BASE_URL}/api/household/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      'X-User-Id': userId,
    },
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to create invite' }))
    throw new Error(error.error || 'Failed to create invite')
  }

  const result = (await response.json()) as CreateHouseholdInviteResponse
  return result.result.invite
}
