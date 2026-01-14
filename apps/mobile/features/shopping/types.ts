export type PantryItemStatus =
  | 'in_stock'
  | 'running_low'
  | 'out_of_stock'
  | 'planned'

export type ItemType = 'staple' | 'planned'

export interface ShoppingItem {
  id: string
  userId: string
  name: string
  status: PantryItemStatus
  itemType: ItemType
  createdAt: number
  updatedAt: number
  purchasedAt: number | null
}

export interface PantryItem {
  id: string
  userId: string
  name: string
  status: PantryItemStatus
  itemType: ItemType
  createdAt: number
  updatedAt: number
  purchasedAt: number | null
}

export interface ListPantryItemsResponse {
  success: boolean
  result: {
    pantryItems: PantryItem[]
  }
}
