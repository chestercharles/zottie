import { eq } from 'drizzle-orm'
import type { Database } from './index'
import { households, householdMembers, users } from './schema'

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

export async function upsertUser(
  db: Database,
  userId: string,
  email: string,
  name?: string
): Promise<void> {
  const now = new Date()
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (existingUser.length > 0) {
    await db
      .update(users)
      .set({
        email,
        name,
        updatedAt: now,
      })
      .where(eq(users.id, userId))
  } else {
    await db.insert(users).values({
      id: userId,
      email,
      name,
      createdAt: now,
      updatedAt: now,
    })
  }
}
