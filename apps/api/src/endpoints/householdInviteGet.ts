import { Bool, OpenAPIRoute, Str } from 'chanfana'
import { eq, and, gt } from 'drizzle-orm'
import { z } from 'zod'
import { type AppContext, HouseholdInviteInfo } from '../types'
import { getDb, householdInvites, households } from '../db'

export class HouseholdInviteGetEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Household'],
    summary: 'Validate an invite code and get the target household info',
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        code: Str({ example: 'abc123xyz' }),
      }),
    },
    responses: {
      '200': {
        description: 'Returns the invite info with household name',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              result: z.object({
                invite: HouseholdInviteInfo,
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
        description: 'Invite not found or expired',
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
    const db = getDb(c.env.db)
    const data = await this.getValidatedData<typeof this.schema>()
    const { code } = data.params

    const now = new Date()

    const invite = await db
      .select({
        id: householdInvites.id,
        householdId: householdInvites.householdId,
        code: householdInvites.code,
        expiresAt: householdInvites.expiresAt,
        householdName: households.name,
      })
      .from(householdInvites)
      .innerJoin(households, eq(householdInvites.householdId, households.id))
      .where(
        and(eq(householdInvites.code, code), gt(householdInvites.expiresAt, now))
      )
      .limit(1)

    if (invite.length === 0) {
      return c.json(
        { success: false, error: 'Invite not found or expired' },
        404
      )
    }

    return {
      success: true,
      result: {
        invite: {
          code: invite[0].code,
          householdName: invite[0].householdName,
          expiresAt: invite[0].expiresAt.getTime(),
        },
      },
    }
  }
}
