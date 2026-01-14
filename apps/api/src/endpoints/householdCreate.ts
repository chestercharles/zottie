import { Bool, OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import {
  type AppContext,
  Household,
  HouseholdCreate,
  HouseholdMember,
} from '../types'
import { getDb, households, householdMembers } from '../db'

export class HouseholdCreateEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Household'],
    summary: 'Create a new household and add the current user as a member',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: HouseholdCreate,
          },
        },
      },
    },
    responses: {
      '201': {
        description: 'Household created successfully',
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
      '409': {
        description: 'User already belongs to a household',
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

    const data = await this.getValidatedData<typeof this.schema>()
    const { name } = data.body

    const existingMembership = await db
      .select()
      .from(householdMembers)
      .where(eq(householdMembers.userId, userId))
      .limit(1)

    if (existingMembership.length > 0) {
      return c.json(
        { success: false, error: 'User already belongs to a household' },
        409
      )
    }

    const householdId = crypto.randomUUID()
    const memberId = crypto.randomUUID()
    const now = new Date()

    await db.insert(households).values({
      id: householdId,
      name,
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(householdMembers).values({
      id: memberId,
      householdId,
      userId,
      email: userEmail,
      name: userName,
      joinedAt: now,
    })

    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, householdId))

    const membersData = await db
      .select()
      .from(householdMembers)
      .where(eq(householdMembers.householdId, householdId))

    return c.json(
      {
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
      },
      201
    )
  }
}
