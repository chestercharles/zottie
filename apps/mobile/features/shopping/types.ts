export type PantryItemStatus = 'in_stock' | 'running_low' | 'out_of_stock'

export type ItemType = 'staple' | 'planned'

export interface ShoppingItem {
  id: string
  userId: string
  name: string
  status: PantryItemStatus
  itemType: ItemType
  createdAt: number
  updatedAt: number
}

export interface PantryItem {
  id: string
  userId: string
  name: string
  status: PantryItemStatus
  createdAt: number
  updatedAt: number
}

export interface ListPantryItemsResponse {
  success: boolean
  result: {
    pantryItems: PantryItem[]
  }
}
