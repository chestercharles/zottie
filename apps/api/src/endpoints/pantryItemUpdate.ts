import { Bool, OpenAPIRoute, Str } from 'chanfana'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { type AppContext, PantryItem, PantryItemUpdate } from '../types'
import { getDb, pantryItems, type PantryItemStatus } from '../db'

export class PantryItemUpdateEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Pantry Items'],
    summary: 'Update a pantry item',
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: Str({ example: '550e8400-e29b-41d4-a716-446655440000' }),
      }),
      body: {
        content: {
          'application/json': {
            schema: PantryItemUpdate,
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Returns the updated pantry item',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              result: z.object({
                pantryItem: PantryItem,
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

    const data = await this.getValidatedData<typeof this.schema>()
    const { id } = data.params
    const { status, name } = data.body

    const db = getDb(c.env.db)

    const existingItems = await db
      .select()
      .from(pantryItems)
      .where(and(eq(pantryItems.id, id), eq(pantryItems.userId, userId)))

    if (existingItems.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Pantry item not found',
        },
        404
      )
    }

    const now = new Date()

    const updateData: { updatedAt: Date; status?: PantryItemStatus; name?: string } = {
      updatedAt: now,
    }
    if (status !== undefined) {
      updateData.status = status as PantryItemStatus
    }
    if (name !== undefined) {
      updateData.name = name
    }

    await db
      .update(pantryItems)
      .set(updateData)
      .where(and(eq(pantryItems.id, id), eq(pantryItems.userId, userId)))

    const updatedItems = await db
      .select()
      .from(pantryItems)
      .where(and(eq(pantryItems.id, id), eq(pantryItems.userId, userId)))

    const updatedItem = updatedItems[0]

    return {
      success: true,
      result: {
        pantryItem: {
          id: updatedItem.id,
          userId: updatedItem.userId,
          name: updatedItem.name,
          status: updatedItem.status,
          itemType: updatedItem.itemType,
          createdAt: updatedItem.createdAt.getTime(),
          updatedAt: updatedItem.updatedAt.getTime(),
        },
      },
    }
  }
}
