import { Bool, OpenAPIRoute, Str } from 'chanfana'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { type AppContext, Goto, GotoUpdate } from '../types'
import { getDb, gotos, getHouseholdId } from '../db'

export class GotoUpdateEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Go-tos'],
    summary: 'Update a go-to',
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: Str({ example: '550e8400-e29b-41d4-a716-446655440000' }),
      }),
      body: {
        content: {
          'application/json': {
            schema: GotoUpdate,
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Returns the updated go-to',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              result: z.object({
                goto: Goto,
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
        description: 'Go-to not found',
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

    const householdId = await getHouseholdId(db, userId)

    if (!householdId) {
      return c.json(
        { success: false, error: 'User must join a household first' },
        403
      )
    }

    const data = await this.getValidatedData<typeof this.schema>()
    const { id } = data.params
    const { name, needs } = data.body

    const existingItems = await db
      .select()
      .from(gotos)
      .where(and(eq(gotos.id, id), eq(gotos.householdId, householdId)))

    if (existingItems.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Go-to not found',
        },
        404
      )
    }

    const now = new Date()

    const updateData: {
      updatedAt: Date
      name?: string
      needs?: string
    } = {
      updatedAt: now,
    }
    if (name !== undefined) {
      updateData.name = name
    }
    if (needs !== undefined) {
      updateData.needs = needs
    }

    await db
      .update(gotos)
      .set(updateData)
      .where(and(eq(gotos.id, id), eq(gotos.householdId, householdId)))

    const updatedItems = await db
      .select()
      .from(gotos)
      .where(and(eq(gotos.id, id), eq(gotos.householdId, householdId)))

    const updatedItem = updatedItems[0]

    return {
      success: true,
      result: {
        goto: {
          id: updatedItem.id,
          householdId: updatedItem.householdId,
          createdBy: updatedItem.createdBy,
          name: updatedItem.name,
          needs: updatedItem.needs,
          createdAt: updatedItem.createdAt.getTime(),
          updatedAt: updatedItem.updatedAt.getTime(),
        },
      },
    }
  }
}
