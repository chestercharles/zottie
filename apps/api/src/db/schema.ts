import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const households = sqliteTable('households', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export type Household = typeof households.$inferSelect
export type NewHousehold = typeof households.$inferInsert

export const householdMembers = sqliteTable('household_members', {
  id: text('id').primaryKey(),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id),
  userId: text('user_id').notNull().unique(),
  joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull(),
})

export type HouseholdMember = typeof householdMembers.$inferSelect
export type NewHouseholdMember = typeof householdMembers.$inferInsert

export const pantryItemStatus = [
  'in_stock',
  'running_low',
  'out_of_stock',
  'planned',
] as const
export type PantryItemStatus = (typeof pantryItemStatus)[number]

export const pantryItemType = ['staple', 'planned'] as const
export type PantryItemType = (typeof pantryItemType)[number]

export const pantryItems = sqliteTable('pantry_items', {
  id: text('id').primaryKey(),
  householdId: text('household_id').references(() => households.id),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  status: text('status', { enum: pantryItemStatus })
    .notNull()
    .default('in_stock'),
  itemType: text('item_type', { enum: pantryItemType })
    .notNull()
    .default('staple'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  purchasedAt: integer('purchased_at', { mode: 'timestamp' }),
})

export type PantryItem = typeof pantryItems.$inferSelect
export type NewPantryItem = typeof pantryItems.$inferInsert
