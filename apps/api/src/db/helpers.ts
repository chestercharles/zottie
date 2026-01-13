import { eq } from 'drizzle-orm'
import type { Database } from './index'
import { householdMembers } from './schema'

export async function getHouseholdId(
  db: Database,
  userId: string
): Promise<string | null> {
  const existingMembership = await db
    .select()
    .from(householdMembers)
    .where(eq(householdMembers.userId, userId))
    .limit(1)

  if (existingMembership.length > 0) {
    return existingMembership[0].householdId
  }

  return null
}
