import { Bool, OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { type AppContext, Household, HouseholdMember } from '../types'
import {
  getDb,
  households,
  householdMembers,
  householdInvites,
  pantryItems,
} from '../db'

export class HouseholdLeaveEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Household'],
    summary: 'Leave the current household and create a new one',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': {
        description:
          'Successfully left household and created a new one for the user',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              result: z.object({
                household: Household,
                members: z.array(HouseholdMember),
              }),
            }),
          },
        },
      },
      '401': {
        description: 'Unauthorized - no valid authentication provided',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              error: z.string(),
            }),
          },
        },
      },
      '404': {
        description: 'User does not belong to any household',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              error: z.string(),
            }),
          },
        },
      },
    },
  }

  async handle(c: AppContext) {
    const userId = c.get('userId')
    const userEmail = c.get('userEmail')
    const userName = c.get('userName')
    const db = getDb(c.env.db)

    const existingMembership = await db
      .select()
      .from(householdMembers)
      .where(eq(householdMembers.userId, userId))
      .limit(1)

    if (existingMembership.length === 0) {
      return c.json(
        { success: false, error: 'User does not belong to any household' },
        404
      )
    }

    const oldHouseholdId = existingMembership[0].householdId

    const remainingMembers = await db
      .select()
      .from(householdMembers)
      .where(eq(householdMembers.householdId, oldHouseholdId))

    const isLastMember = remainingMembers.length === 1

    await db
      .delete(householdMembers)
      .where(eq(householdMembers.id, existingMembership[0].id))

    if (isLastMember) {
      await db
        .delete(pantryItems)
        .where(eq(pantryItems.householdId, oldHouseholdId))
      await db
        .delete(householdInvites)
        .where(eq(householdInvites.householdId, oldHouseholdId))
      await db.delete(households).where(eq(households.id, oldHouseholdId))
    }

    const newHouseholdId = crypto.randomUUID()
    const memberId = crypto.randomUUID()
    const now = new Date()

    await db.insert(households).values({
      id: newHouseholdId,
      name: 'My Household',
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(householdMembers).values({
      id: memberId,
      householdId: newHouseholdId,
      userId,
      email: userEmail,
      name: userName,
      joinedAt: now,
    })

    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, newHouseholdId))

    const membersData = await db
      .select()
      .from(householdMembers)
      .where(eq(householdMembers.householdId, newHouseholdId))

    return {
      success: true,
      result: {
        household: {
          id: household.id,
          name: household.name,
          createdAt: household.createdAt.getTime(),
          updatedAt: household.updatedAt.getTime(),
        },
        members: membersData.map((m) => ({
          id: m.id,
          householdId: m.householdId,
          userId: m.userId,
          email: m.email,
          name: m.name,
          joinedAt: m.joinedAt.getTime(),
        })),
      },
    }
  }
}
