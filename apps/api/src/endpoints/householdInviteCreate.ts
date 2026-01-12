import { Bool, OpenAPIRoute } from 'chanfana'
import { eq, and, gt } from 'drizzle-orm'
import { z } from 'zod'
import { type AppContext, HouseholdInvite } from '../types'
import { getDb, householdMembers, householdInvites } from '../db'

function generateInviteCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export class HouseholdInviteCreateEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Household'],
    summary:
      'Generate a new invite link for the household (invalidates previous invite)',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': {
        description: 'Returns the new invite',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              result: z.object({
                invite: HouseholdInvite,
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
        description: 'Household not found',
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

    const membership = await db
      .select()
      .from(householdMembers)
      .where(eq(householdMembers.userId, userId))
      .limit(1)

    if (membership.length === 0) {
      return c.json({ success: false, error: 'Household not found' }, 404)
    }

    const householdId = membership[0].householdId
    const now = new Date()

    await db
      .delete(householdInvites)
      .where(
        and(
          eq(householdInvites.householdId, householdId),
          gt(householdInvites.expiresAt, now)
        )
      )

    const inviteId = crypto.randomUUID()
    const code = generateInviteCode()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    await db.insert(householdInvites).values({
      id: inviteId,
      householdId,
      code,
      createdBy: userId,
      expiresAt,
      createdAt: now,
    })

    return {
      success: true,
      result: {
        invite: {
          id: inviteId,
          householdId,
          code,
          createdBy: userId,
          expiresAt: expiresAt.getTime(),
          createdAt: now.getTime(),
        },
      },
    }
  }
}
