export type OnboardingFlagType = 'original' | 'conversational'

export interface OnboardingFlagResponse {
  flag: OnboardingFlagType
}

export type CommandActionType =
  | 'add_to_pantry'
  | 'update_pantry_status'
  | 'remove_from_shopping_list'

export type PantryStatus = 'in_stock' | 'running_low' | 'out_of_stock'

export interface CommandAction {
  type: CommandActionType
  item: string
  status?: PantryStatus
}

export interface CommandParseRequest {
  command: string
}

export interface CommandParseResponse {
  result: {
    actions: CommandAction[]
    message?: string
  }
}

export interface CommandExecuteRequest {
  actions: CommandAction[]
}

export interface CommandExecuteResponse {
  result: {
    executedCount: number
    failedCount: number
  }
}
