import { Bool, OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { type AppContext, Goto } from '../types'
import { getDb, gotos, getHouseholdId } from '../db'

export class GotoListEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Go-tos'],
    summary: 'List all go-tos for the authenticated user household',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': {
        description: 'Returns the list of go-tos',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              result: z.object({
                gotos: z.array(Goto),
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

    const householdId = await getHouseholdId(db, userId)

    if (!householdId) {
      return {
        success: true,
        result: {
          gotos: [],
        },
      }
    }

    const items = await db
      .select()
      .from(gotos)
      .where(eq(gotos.householdId, householdId))

    return {
      success: true,
      result: {
        gotos: items.map((item) => ({
          id: item.id,
          householdId: item.householdId,
          createdBy: item.createdBy,
          name: item.name,
          needs: item.needs,
          createdAt: item.createdAt.getTime(),
          updatedAt: item.updatedAt.getTime(),
        })),
      },
    }
  }
}
