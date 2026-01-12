import { Bool, OpenAPIRoute } from 'chanfana'
import { z } from 'zod'
import { type AppContext, PantryItem, PantryItemCreate } from '../types'
import { getDb, pantryItems, getOrCreateHouseholdId } from '../db'

export class PantryItemCreateEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Pantry Items'],
    summary: 'Create a new pantry item',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: PantryItemCreate,
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Returns the created pantry item',
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
    },
  }

  async handle(c: AppContext) {
    const userId = c.get('userId')
    const db = getDb(c.env.db)

    const householdId = await getOrCreateHouseholdId(db, userId)

    const data = await this.getValidatedData<typeof this.schema>()
    const { name, status, itemType } = data.body

    const id = crypto.randomUUID()
    const now = new Date()

    const newItem = {
      id,
      householdId,
      userId,
      name,
      status: status || 'in_stock',
      itemType: itemType || 'staple',
      createdAt: now,
      updatedAt: now,
    }

    await db.insert(pantryItems).values(newItem)

    return {
      success: true,
      result: {
        pantryItem: {
          id: newItem.id,
          userId: newItem.userId,
          householdId: newItem.householdId,
          name: newItem.name,
          status: newItem.status,
          itemType: newItem.itemType,
          createdAt: newItem.createdAt.getTime(),
          updatedAt: newItem.updatedAt.getTime(),
          purchasedAt: null,
        },
      },
    }
  }
}
