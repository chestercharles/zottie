import { Bool, OpenAPIRoute } from 'chanfana'
import { z } from 'zod'
import { type AppContext, PantryItem, PantryItemCreate } from '../types'
import { getDb, pantryItems } from '../db'

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
    // Get user ID from Authorization header (Auth0 sub claim)
    // TODO: Replace with proper JWT validation middleware
    const authHeader = c.req.header('Authorization')
    const userId = c.req.header('X-User-Id') // Temporary for development

    if (!userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized: No user ID provided',
        },
        401
      )
    }

    // Get validated data
    const data = await this.getValidatedData<typeof this.schema>()
    const { name, status } = data.body

    // Generate UUID for the new item
    const id = crypto.randomUUID()
    const now = new Date()

    // Insert into database
    const db = getDb(c.env.db)
    const newItem = {
      id,
      userId,
      name,
      status: status || 'in_stock',
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
          name: newItem.name,
          status: newItem.status,
          createdAt: newItem.createdAt.getTime(),
          updatedAt: newItem.updatedAt.getTime(),
        },
      },
    }
  }
}
