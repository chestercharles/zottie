import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const pantryItemStatus = [
  'in_stock',
  'running_low',
  'out_of_stock',
] as const
export type PantryItemStatus = (typeof pantryItemStatus)[number]

export const pantryItems = sqliteTable('pantry_items', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  status: text('status', { enum: pantryItemStatus })
    .notNull()
    .default('in_stock'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export type PantryItem = typeof pantryItems.$inferSelect
export type NewPantryItem = typeof pantryItems.$inferInsert
