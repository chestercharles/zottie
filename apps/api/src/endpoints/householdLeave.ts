import { Bool, OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { type AppContext } from '../types'
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
    summary: 'Leave the current household',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': {
        description: 'Successfully left household',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
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

    return {
      success: true,
    }
  }
}
