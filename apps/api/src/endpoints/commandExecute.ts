import { Bool, OpenAPIRoute } from 'chanfana'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { type AppContext, CommandAction } from '../types'
import {
  getDb,
  pantryItems,
  getHouseholdId,
  type PantryItemStatus,
} from '../db'

export class CommandExecuteEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Commands'],
    summary: 'Execute structured actions from command parsing',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              actions: z.array(CommandAction),
            }),
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Returns the execution results',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              result: z.object({
                executed: z.number(),
                failed: z.number(),
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
    const { actions } = data.body

    let executed = 0
    let failed = 0

    for (const action of actions) {
      try {
        const itemName = action.item.toLowerCase()

        if (action.type === 'add_to_pantry') {
          const existingItems = await db
            .select()
            .from(pantryItems)
            .where(
              and(
                eq(pantryItems.householdId, householdId),
                eq(pantryItems.name, itemName)
              )
            )

          if (existingItems.length === 0) {
            const id = crypto.randomUUID()
            const now = new Date()

            await db.insert(pantryItems).values({
              id,
              householdId,
              userId,
              name: itemName,
              status: action.status || 'in_stock',
              itemType: 'staple',
              createdAt: now,
              updatedAt: now,
            })
          } else {
            const now = new Date()
            const updateData: {
              updatedAt: Date
              status: PantryItemStatus
              purchasedAt?: Date
            } = {
              updatedAt: now,
              status: (action.status || 'in_stock') as PantryItemStatus,
            }

            if (
              action.status === 'in_stock' &&
              existingItems[0].status !== 'in_stock'
            ) {
              updateData.purchasedAt = now
            }

            await db
              .update(pantryItems)
              .set(updateData)
              .where(
                and(
                  eq(pantryItems.householdId, householdId),
                  eq(pantryItems.name, itemName)
                )
              )
          }

          executed++
        } else if (action.type === 'update_pantry_status') {
          const existingItems = await db
            .select()
            .from(pantryItems)
            .where(
              and(
                eq(pantryItems.householdId, householdId),
                eq(pantryItems.name, itemName)
              )
            )

          if (existingItems.length === 0) {
            const id = crypto.randomUUID()
            const now = new Date()

            await db.insert(pantryItems).values({
              id,
              householdId,
              userId,
              name: itemName,
              status: action.status || 'in_stock',
              itemType: 'staple',
              createdAt: now,
              updatedAt: now,
            })
          } else {
            const now = new Date()
            const updateData: {
              updatedAt: Date
              status: PantryItemStatus
              purchasedAt?: Date
            } = {
              updatedAt: now,
              status: (action.status || 'in_stock') as PantryItemStatus,
            }

            if (
              action.status === 'in_stock' &&
              existingItems[0].status !== 'in_stock'
            ) {
              updateData.purchasedAt = now
            }

            await db
              .update(pantryItems)
              .set(updateData)
              .where(
                and(
                  eq(pantryItems.householdId, householdId),
                  eq(pantryItems.name, itemName)
                )
              )
          }

          executed++
        } else if (action.type === 'remove_from_shopping_list') {
          const existingItems = await db
            .select()
            .from(pantryItems)
            .where(
              and(
                eq(pantryItems.householdId, householdId),
                eq(pantryItems.name, itemName)
              )
            )

          if (existingItems.length > 0) {
            const now = new Date()

            await db
              .update(pantryItems)
              .set({
                status: 'in_stock',
                updatedAt: now,
                purchasedAt: now,
              })
              .where(
                and(
                  eq(pantryItems.householdId, householdId),
                  eq(pantryItems.name, itemName)
                )
              )

            executed++
          } else {
            failed++
          }
        }
      } catch (error) {
        failed++
      }
    }

    return {
      success: true,
      result: {
        executed,
        failed,
      },
    }
  }
}
