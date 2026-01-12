import { Bool, OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { type AppContext, PantryItem } from '../types'
import { getDb, pantryItems } from '../db'

export class PantryItemListEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Pantry Items'],
    summary: 'List all pantry items for the authenticated user',
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
    const userId = c.req.header('X-User-Id')

    if (!userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized: No user ID provided',
        },
        401
      )
    }

    const db = getDb(c.env.db)
    const items = await db
      .select()
      .from(pantryItems)
      .where(eq(pantryItems.userId, userId))

    return {
      success: true,
      result: {
        pantryItems: items.map((item) => ({
          id: item.id,
          userId: item.userId,
          name: item.name,
          status: item.status,
          createdAt: item.createdAt.getTime(),
          updatedAt: item.updatedAt.getTime(),
        })),
      },
    }
  }
}
