import { Bool, OpenAPIRoute, Str } from 'chanfana'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { type AppContext } from '../types'
import { getDb, gotos, getHouseholdId } from '../db'

export class GotoDeleteEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Go-tos'],
    summary: 'Delete a go-to',
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: Str({ example: '550e8400-e29b-41d4-a716-446655440000' }),
      }),
    },
    responses: {
      '200': {
        description: 'Go-to deleted successfully',
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

    await db
      .delete(gotos)
      .where(and(eq(gotos.id, id), eq(gotos.householdId, householdId)))

    return {
      success: true,
    }
  }
}
