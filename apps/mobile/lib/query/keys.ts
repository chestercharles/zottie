export const queryKeys = {
  pantryItems: (userId: string) => ['pantryItems', userId] as const,
  household: (userId: string) => ['household', userId] as const,
}
