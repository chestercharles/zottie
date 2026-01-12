export type PantryItemStatus = 'in_stock' | 'running_low' | 'out_of_stock'

export interface PantryItem {
  id: string
  userId: string
  name: string
  status: PantryItemStatus
  createdAt: number
  updatedAt: number
}

export interface CreatePantryItemRequest {
  name: string
  status?: PantryItemStatus
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
  status: PantryItemStatus
}

export interface UpdatePantryItemResponse {
  success: boolean
  result: {
    pantryItem: PantryItem
  }
}
