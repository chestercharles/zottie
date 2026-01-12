export interface Household {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export interface HouseholdMember {
  id: string
  householdId: string
  userId: string
  joinedAt: number
}

export interface GetHouseholdResponse {
  success: boolean
  result: {
    household: Household
    members: HouseholdMember[]
  }
}

export interface UpdateHouseholdRequest {
  name: string
}

export interface UpdateHouseholdResponse {
  success: boolean
  result: {
    household: Household
  }
}

export interface HouseholdInvite {
  id: string
  householdId: string
  code: string
  createdBy: string
  expiresAt: number
  createdAt: number
}

export interface CreateHouseholdInviteResponse {
  success: boolean
  result: {
    invite: HouseholdInvite
  }
}

export interface HouseholdInviteInfo {
  code: string
  householdId: string
  householdName: string
  expiresAt: number
}

export interface ValidateInviteResponse {
  success: boolean
  result: {
    invite: HouseholdInviteInfo
  }
}

export interface JoinHouseholdResponse {
  success: boolean
  result: {
    household: Household
    members: HouseholdMember[]
    alreadyMember?: boolean
  }
}
