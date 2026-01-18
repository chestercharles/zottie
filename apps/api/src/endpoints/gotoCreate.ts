import { Bool, OpenAPIRoute } from 'chanfana'
import { z } from 'zod'
import { type AppContext, Goto, GotoCreate } from '../types'
import { getDb, gotos, getHouseholdId } from '../db'

export class GotoCreateEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Go-tos'],
    summary: 'Create a new go-to',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: GotoCreate,
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Returns the created go-to',
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
    const { name, needs } = data.body

    const id = crypto.randomUUID()
    const now = new Date()

    const newItem = {
      id,
      householdId,
      createdBy: userId,
      name,
      needs,
      createdAt: now,
      updatedAt: now,
    }

    await db.insert(gotos).values(newItem)

    return {
      success: true,
      result: {
        goto: {
          id: newItem.id,
          householdId: newItem.householdId,
          createdBy: newItem.createdBy,
          name: newItem.name,
          needs: newItem.needs,
          createdAt: newItem.createdAt.getTime(),
          updatedAt: newItem.updatedAt.getTime(),
        },
      },
    }
  }
}
