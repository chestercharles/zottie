import { Bool, OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { type AppContext, PantryItem } from '../types'
import { getDb, pantryItems, getOrCreateHouseholdId } from '../db'

export class PantryItemListEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Pantry Items'],
    summary: 'List all pantry items for the authenticated user household',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': {
        description: 'Returns the list of pantry items',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              result: z.object({
                pantryItems: z.array(PantryItem),
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
    const userEmail = c.get('userEmail')
    const userName = c.get('userName')
    const db = getDb(c.env.db)

    const householdId = await getOrCreateHouseholdId(db, userId, userEmail, userName)

    const items = await db
      .select()
      .from(pantryItems)
      .where(eq(pantryItems.householdId, householdId))

    return {
      success: true,
      result: {
        pantryItems: items.map((item) => ({
          id: item.id,
          userId: item.userId,
          householdId: item.householdId,
          name: item.name,
          status: item.status,
          itemType: item.itemType,
          createdAt: item.createdAt.getTime(),
          updatedAt: item.updatedAt.getTime(),
          purchasedAt: item.purchasedAt?.getTime() ?? null,
        })),
      },
    }
  }
}
