import { Bool, OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { type AppContext, Household, HouseholdMember } from '../types'
import { getDb, households, householdMembers } from '../db'

export class HouseholdGetEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Household'],
    summary:
      'Get the current user household, creating one if it does not exist',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': {
        description: 'Returns the household info and members',
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
    },
  }

  async handle(c: AppContext) {
    const userId = c.get('userId')
    const db = getDb(c.env.db)

    const existingMembership = await db
      .select()
      .from(householdMembers)
      .where(eq(householdMembers.userId, userId))
      .limit(1)

    let householdId: string

    if (existingMembership.length > 0) {
      householdId = existingMembership[0].householdId
    } else {
      householdId = crypto.randomUUID()
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
    }

    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, householdId))

    const members = await db
      .select()
      .from(householdMembers)
      .where(eq(householdMembers.householdId, householdId))

    return {
      success: true,
      result: {
        household: {
          id: household.id,
          name: household.name,
          createdAt: household.createdAt.getTime(),
          updatedAt: household.updatedAt.getTime(),
        },
        members: members.map((m) => ({
          id: m.id,
          householdId: m.householdId,
          userId: m.userId,
          joinedAt: m.joinedAt.getTime(),
        })),
      },
    }
  }
}
