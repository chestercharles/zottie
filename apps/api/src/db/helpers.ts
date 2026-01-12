import { eq } from 'drizzle-orm'
import type { Database } from './index'
import { households, householdMembers } from './schema'

export async function getOrCreateHouseholdId(
  db: Database,
  userId: string
): Promise<string> {
  const existingMembership = await db
    .select()
    .from(householdMembers)
    .where(eq(householdMembers.userId, userId))
    .limit(1)

  if (existingMembership.length > 0) {
    return existingMembership[0].householdId
  }

  const householdId = crypto.randomUUID()
  const now = new Date()
  const memberId = crypto.randomUUID()

  await db.insert(households).values({
    id: householdId,
    name: 'My Household',
    createdAt: now,
    updatedAt: now,
  })

  await db.insert(householdMembers).values({
    id: memberId,
    householdId,
    userId,
    joinedAt: now,
  })

  return householdId
}
