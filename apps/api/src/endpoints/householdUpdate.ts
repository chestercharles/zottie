import { Bool, OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { type AppContext, Household, HouseholdUpdate } from '../types'
import { getDb, households, householdMembers } from '../db'

export class HouseholdUpdateEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Household'],
    summary: 'Update the current user household name',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: HouseholdUpdate,
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Returns the updated household',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              result: z.object({
                household: Household,
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
        description: 'Household not found',
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

    const data = await this.getValidatedData<typeof this.schema>()
    const { name } = data.body

    const membership = await db
      .select()
      .from(householdMembers)
      .where(eq(householdMembers.userId, userId))
      .limit(1)

    if (membership.length === 0) {
      return c.json({ success: false, error: 'Household not found' }, 404)
    }

    const householdId = membership[0].householdId
    const now = new Date()

    await db
      .update(households)
      .set({ name, updatedAt: now })
      .where(eq(households.id, householdId))

    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, householdId))

    return {
      success: true,
      result: {
        household: {
          id: household.id,
          name: household.name,
          createdAt: household.createdAt.getTime(),
          updatedAt: household.updatedAt.getTime(),
        },
      },
    }
  }
}
