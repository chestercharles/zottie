export const queryKeys = {
  pantryItems: (userId: string) => ['pantryItems', userId] as const,
  household: (userId: string) => ['household', userId] as const,
  householdMembership: (userId: string) => ['householdMembership', userId] as const,
  householdInvite: (code: string) => ['householdInvite', code] as const,
}
