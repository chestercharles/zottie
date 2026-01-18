export interface Goto {
  id: string
  householdId: string
  createdBy: string
  name: string
  needs: string
  createdAt: number
  updatedAt: number
}

export interface CreateGotoRequest {
  name: string
  needs: string
}

export interface CreateGotoResponse {
  success: boolean
  result: {
    goto: Goto
  }
}

export interface ListGotosResponse {
  success: boolean
  result: {
    gotos: Goto[]
  }
}

export interface UpdateGotoRequest {
  name?: string
  needs?: string
}

export interface UpdateGotoResponse {
  success: boolean
  result: {
    goto: Goto
  }
}

export interface DeleteGotoResponse {
  success: boolean
}
