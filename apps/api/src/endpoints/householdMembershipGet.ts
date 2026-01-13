import { Bool, OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { type AppContext, Household, HouseholdMember } from '../types'
import { getDb, households, householdMembers, users, upsertUser } from '../db'

export class HouseholdMembershipGetEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Household'],
    summary:
      "Get the current user's household membership, returns 404 if user has no household",
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

    if (userEmail) {
      await upsertUser(db, userId, userEmail, userName)
    }

    const existingMembership = await db
      .select()
      .from(householdMembers)
      .where(eq(householdMembers.userId, userId))
      .limit(1)

    if (existingMembership.length === 0) {
      return c.json({ success: false, error: 'No household membership found' }, 404)
    }

    const householdId = existingMembership[0].householdId

    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, householdId))

    const membersData = await db
      .select({
        id: householdMembers.id,
        householdId: householdMembers.householdId,
        userId: householdMembers.userId,
        joinedAt: householdMembers.joinedAt,
        email: users.email,
        name: users.name,
      })
      .from(householdMembers)
      .innerJoin(users, eq(householdMembers.userId, users.id))
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
