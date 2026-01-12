export type PantryItemStatus = 'in_stock' | 'running_low' | 'out_of_stock' | 'planned'

export type ItemType = 'staple' | 'planned'

export interface PantryItem {
  id: string
  userId: string
  householdId: string | null
  name: string
  status: PantryItemStatus
  itemType: ItemType
  createdAt: number
  updatedAt: number
  purchasedAt: number | null
}

export interface CreatePantryItemRequest {
  name: string
  status?: PantryItemStatus
  itemType?: ItemType
}

export interface CreatePantryItemResponse {
  success: boolean
  result: {
    pantryItem: PantryItem
  }
}

export interface ListPantryItemsResponse {
  success: boolean
  result: {
    pantryItems: PantryItem[]
  }
}

export interface UpdatePantryItemRequest {
  status?: PantryItemStatus
  name?: string
}

export interface UpdatePantryItemResponse {
  success: boolean
  result: {
    pantryItem: PantryItem
  }
}

export interface DeletePantryItemResponse {
  success: boolean
}
