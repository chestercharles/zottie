import { Bool, OpenAPIRoute, Str } from 'chanfana'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { type AppContext } from '../types'
import { getDb, pantryItems, getHouseholdId } from '../db'

export class PantryItemDeleteEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Pantry Items'],
    summary: 'Delete a pantry item',
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: Str({ example: '550e8400-e29b-41d4-a716-446655440000' }),
      }),
    },
    responses: {
      '200': {
        description: 'Pantry item deleted successfully',
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
      '403': {
        description: 'Forbidden - user must join a household first',
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
        description: 'Pantry item not found',
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

    const householdId = await getHouseholdId(db, userId)

    if (!householdId) {
      return c.json(
        { success: false, error: 'User must join a household first' },
        403
      )
    }

    const data = await this.getValidatedData<typeof this.schema>()
    const { id } = data.params

    const existingItems = await db
      .select()
      .from(pantryItems)
      .where(
        and(eq(pantryItems.id, id), eq(pantryItems.householdId, householdId))
      )

    if (existingItems.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Pantry item not found',
        },
        404
      )
    }

    await db
      .delete(pantryItems)
      .where(
        and(eq(pantryItems.id, id), eq(pantryItems.householdId, householdId))
      )

    return {
      success: true,
    }
  }
}
