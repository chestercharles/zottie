import type {
  CreateHouseholdRequest,
  CreateHouseholdResponse,
  GetHouseholdResponse,
  Household,
  HouseholdInvite,
  HouseholdInviteInfo,
  HouseholdMember,
  UpdateHouseholdRequest,
  UpdateHouseholdResponse,
  CreateHouseholdInviteResponse,
  ValidateInviteResponse,
  JoinHouseholdResponse,
  LeaveHouseholdResponse,
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

export async function getHouseholdMembership(
  authToken: string,
  userId: string
): Promise<{ household: Household; members: HouseholdMember[] } | null> {
  const response = await fetch(`${API_BASE_URL}/api/household/membership`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'X-User-Id': userId,
    },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to fetch household membership' }))
    throw new Error(error.error || 'Failed to fetch household membership')
  }

  const result = (await response.json()) as GetHouseholdResponse
  return result.result
}

export async function createHousehold(
  data: CreateHouseholdRequest,
  authToken: string,
  userId: string
): Promise<{ household: Household; members: HouseholdMember[] }> {
  const response = await fetch(`${API_BASE_URL}/api/household`, {
    method: 'POST',
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
      .catch(() => ({ error: 'Failed to create household' }))
    throw new Error(error.error || 'Failed to create household')
  }

  const result = (await response.json()) as CreateHouseholdResponse
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

export async function validateInvite(
  code: string,
  authToken: string,
  userId: string
): Promise<HouseholdInviteInfo> {
  const response = await fetch(`${API_BASE_URL}/api/household/invite/${code}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'X-User-Id': userId,
    },
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Invalid or expired invite' }))
    throw new Error(error.error || 'Invalid or expired invite')
  }

  const result = (await response.json()) as ValidateInviteResponse
  return result.result.invite
}

export async function joinHousehold(
  code: string,
  authToken: string,
  userId: string
): Promise<{ household: Household; members: HouseholdMember[]; alreadyMember?: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/household/join/${code}`, {
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
      .catch(() => ({ error: 'Failed to join household' }))
    throw new Error(error.error || 'Failed to join household')
  }

  const result = (await response.json()) as JoinHouseholdResponse
  return result.result
}

export async function leaveHousehold(
  authToken: string,
  userId: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/household/leave`, {
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
      .catch(() => ({ error: 'Failed to leave household' }))
    throw new Error(error.error || 'Failed to leave household')
  }
}
