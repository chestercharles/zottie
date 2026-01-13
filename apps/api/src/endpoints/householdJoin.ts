import { Bool, OpenAPIRoute, Str } from 'chanfana'
import { eq, and, gt } from 'drizzle-orm'
import { z } from 'zod'
import { type AppContext, Household, HouseholdMember } from '../types'
import { getDb, householdInvites, households, householdMembers } from '../db'

export class HouseholdJoinEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Household'],
    summary: 'Join a household via invite code',
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        code: Str({ example: 'abc123xyz' }),
      }),
    },
    responses: {
      '200': {
        description: 'Successfully joined the household (or already a member)',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              result: z.object({
                household: Household,
                members: z.array(HouseholdMember),
                alreadyMember: Bool().optional(),
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
    const userId = c.get('userId')
    const userEmail = c.get('userEmail')
    const userName = c.get('userName')
    const db = getDb(c.env.db)
    const data = await this.getValidatedData<typeof this.schema>()
    const { code } = data.params

    const now = new Date()

    const invite = await db
      .select({
        id: householdInvites.id,
        householdId: householdInvites.householdId,
      })
      .from(householdInvites)
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

    const existingMembership = await db
      .select()
      .from(householdMembers)
      .where(eq(householdMembers.userId, userId))
      .limit(1)

    if (existingMembership.length > 0) {
      if (existingMembership[0].householdId === invite[0].householdId) {
        const [household] = await db
          .select()
          .from(households)
          .where(eq(households.id, invite[0].householdId))

        const membersData = await db
          .select()
          .from(householdMembers)
          .where(eq(householdMembers.householdId, invite[0].householdId))

        return {
          success: true,
          result: {
            household: {
              id: household.id,
              name: household.name,
              createdAt: household.createdAt.getTime(),
              updatedAt: household.updatedAt.getTime(),
            },
            members: membersData.map((m) => ({
              id: m.id,
              householdId: m.householdId,
              userId: m.userId,
              email: m.email,
              name: m.name,
              joinedAt: m.joinedAt.getTime(),
            })),
            alreadyMember: true,
          },
        }
      }

      await db
        .delete(householdMembers)
        .where(eq(householdMembers.id, existingMembership[0].id))
    }

    const memberId = crypto.randomUUID()
    await db.insert(householdMembers).values({
      id: memberId,
      householdId: invite[0].householdId,
      userId,
      email: userEmail,
      name: userName,
      joinedAt: now,
    })

    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, invite[0].householdId))

    const membersData = await db
      .select()
      .from(householdMembers)
      .where(eq(householdMembers.householdId, invite[0].householdId))

    return {
      success: true,
      result: {
        household: {
          id: household.id,
          name: household.name,
          createdAt: household.createdAt.getTime(),
          updatedAt: household.updatedAt.getTime(),
        },
        members: membersData.map((m) => ({
          id: m.id,
          householdId: m.householdId,
          userId: m.userId,
          email: m.email,
          name: m.name,
          joinedAt: m.joinedAt.getTime(),
        })),
      },
    }
  }
}
