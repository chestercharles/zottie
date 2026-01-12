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
])

export const PantryItemCreate = z.object({
  name: Str({ example: 'Milk' }),
  status: PantryItemStatusEnum.optional().default('in_stock'),
})

export const PantryItemUpdate = z.object({
  status: PantryItemStatusEnum,
})

export const PantryItem = z.object({
  id: Str({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  userId: Str({ example: 'auth0|123456789' }),
  name: Str({ example: 'Milk' }),
  status: PantryItemStatusEnum,
  createdAt: z.number(),
  updatedAt: z.number(),
})
