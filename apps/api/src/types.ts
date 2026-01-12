import { Str } from 'chanfana'
import type { Context } from 'hono'
import { z } from 'zod'
import type { AuthVariables } from './middleware/auth'

declare global {
  interface Env {
    AUTH0_DOMAIN: string
    AUTH0_AUDIENCE: string
    TEST_JWT_SECRET?: string
  }
}

export type AppContext = Context<{ Bindings: Env; Variables: AuthVariables }>

export const PantryItemStatusEnum = z.enum([
  'in_stock',
  'running_low',
  'out_of_stock',
  'planned',
])

export const PantryItemTypeEnum = z.enum(['staple', 'planned'])

export const PantryItemCreate = z.object({
  name: Str({ example: 'Milk' }),
  status: PantryItemStatusEnum.optional().default('in_stock'),
  itemType: PantryItemTypeEnum.optional().default('staple'),
})

export const PantryItemUpdate = z.object({
  status: PantryItemStatusEnum.optional(),
  name: Str({ example: 'Milk' }).optional(),
})

export const PantryItem = z.object({
  id: Str({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  userId: Str({ example: 'auth0|123456789' }),
  householdId: Str({ example: '550e8400-e29b-41d4-a716-446655440001' }).nullable(),
  name: Str({ example: 'Milk' }),
  status: PantryItemStatusEnum,
  itemType: PantryItemTypeEnum,
  createdAt: z.number(),
  updatedAt: z.number(),
  purchasedAt: z.number().nullable(),
})

export const Household = z.object({
  id: Str({ example: '550e8400-e29b-41d4-a716-446655440001' }),
  name: Str({ example: 'My Household' }),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const HouseholdMember = z.object({
  id: Str({ example: '550e8400-e29b-41d4-a716-446655440002' }),
  householdId: Str({ example: '550e8400-e29b-41d4-a716-446655440001' }),
  userId: Str({ example: 'auth0|123456789' }),
  joinedAt: z.number(),
})

export const HouseholdUpdate = z.object({
  name: Str({ example: 'My Household' }),
})
