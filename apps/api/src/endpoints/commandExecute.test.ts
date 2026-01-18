import { describe, it, expect, beforeAll } from 'vitest'
import { createTestToken } from '../test-utils/jwt'

const API_URL = 'http://localhost:8787'

interface PantryItem {
  id: string
  userId: string
  householdId: string
  name: string
  status: 'in_stock' | 'running_low' | 'out_of_stock' | 'planned'
  itemType: 'staple' | 'planned'
  createdAt: number
  updatedAt: number
  purchasedAt: number | null
}

interface CommandExecuteResponse {
  success: boolean
  result: {
    executed: number
    failed: number
  }
}

interface PantryListResponse {
  success: boolean
  result: {
    pantryItems: PantryItem[]
  }
}

describe('Command Execute Endpoint', () => {
  let token: string
  const userId = `auth0|eval-execute-${Date.now()}`

  beforeAll(async () => {
    token = await createTestToken({
      userId,
      email: `${userId}@example.com`,
    })

    await fetch(`${API_URL}/api/household`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Execute Test Household' }),
    })
  })

  it('should execute add_to_pantry action', async () => {
    const response = await fetch(`${API_URL}/api/commands/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        actions: [{ type: 'add_to_pantry', item: 'apple', status: 'in_stock' }],
      }),
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as CommandExecuteResponse
    expect(data.success).toBe(true)
    expect(data.result.executed).toBe(1)
    expect(data.result.failed).toBe(0)

    const pantryResponse = await fetch(`${API_URL}/api/pantry-items`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const pantryData = (await pantryResponse.json()) as PantryListResponse
    const appleItem = pantryData.result.pantryItems.find(
      (i) => i.name === 'apple'
    )
    expect(appleItem).toBeDefined()
    expect(appleItem?.status).toBe('in_stock')
  })

  it('should execute update_pantry_status action', async () => {
    await fetch(`${API_URL}/api/pantry-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'banana', status: 'in_stock' }),
    })

    const response = await fetch(`${API_URL}/api/commands/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        actions: [
          {
            type: 'update_pantry_status',
            item: 'banana',
            status: 'running_low',
          },
        ],
      }),
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as CommandExecuteResponse
    expect(data.success).toBe(true)
    expect(data.result.executed).toBe(1)
    expect(data.result.failed).toBe(0)

    const pantryResponse = await fetch(`${API_URL}/api/pantry-items`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const pantryData = (await pantryResponse.json()) as PantryListResponse
    const bananaItem = pantryData.result.pantryItems.find(
      (i) => i.name === 'banana'
    )
    expect(bananaItem).toBeDefined()
    expect(bananaItem?.status).toBe('running_low')
  })

  it('should execute remove_from_shopping_list action', async () => {
    await fetch(`${API_URL}/api/pantry-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'orange', status: 'out_of_stock' }),
    })

    const response = await fetch(`${API_URL}/api/commands/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        actions: [{ type: 'remove_from_shopping_list', item: 'orange' }],
      }),
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as CommandExecuteResponse
    expect(data.success).toBe(true)
    expect(data.result.executed).toBe(1)
    expect(data.result.failed).toBe(0)

    const pantryResponse = await fetch(`${API_URL}/api/pantry-items`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const pantryData = (await pantryResponse.json()) as PantryListResponse
    const orangeItem = pantryData.result.pantryItems.find(
      (i) => i.name === 'orange'
    )
    expect(orangeItem).toBeDefined()
    expect(orangeItem?.status).toBe('in_stock')
  })

  it('should handle multiple actions', async () => {
    const response = await fetch(`${API_URL}/api/commands/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        actions: [
          { type: 'add_to_pantry', item: 'milk', status: 'in_stock' },
          { type: 'add_to_pantry', item: 'bread', status: 'running_low' },
          { type: 'add_to_pantry', item: 'cheese', status: 'out_of_stock' },
        ],
      }),
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as CommandExecuteResponse
    expect(data.success).toBe(true)
    expect(data.result.executed).toBe(3)
    expect(data.result.failed).toBe(0)

    const pantryResponse = await fetch(`${API_URL}/api/pantry-items`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const pantryData = (await pantryResponse.json()) as PantryListResponse
    expect(
      pantryData.result.pantryItems.find((i) => i.name === 'milk')
    ).toBeDefined()
    expect(
      pantryData.result.pantryItems.find((i) => i.name === 'bread')
    ).toBeDefined()
    expect(
      pantryData.result.pantryItems.find((i) => i.name === 'cheese')
    ).toBeDefined()
  })

  it('should update existing item if add_to_pantry called on existing item', async () => {
    await fetch(`${API_URL}/api/pantry-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'butter', status: 'out_of_stock' }),
    })

    const response = await fetch(`${API_URL}/api/commands/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        actions: [
          { type: 'add_to_pantry', item: 'butter', status: 'in_stock' },
        ],
      }),
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as CommandExecuteResponse
    expect(data.success).toBe(true)
    expect(data.result.executed).toBe(1)

    const pantryResponse = await fetch(`${API_URL}/api/pantry-items`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const pantryData = (await pantryResponse.json()) as PantryListResponse
    const butterItems = pantryData.result.pantryItems.filter(
      (i) => i.name === 'butter'
    )
    expect(butterItems.length).toBe(1)
    expect(butterItems[0].status).toBe('in_stock')
  })

  it('should handle update_pantry_status for non-existing item by creating it', async () => {
    const response = await fetch(`${API_URL}/api/commands/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        actions: [
          {
            type: 'update_pantry_status',
            item: 'yogurt',
            status: 'running_low',
          },
        ],
      }),
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as CommandExecuteResponse
    expect(data.success).toBe(true)
    expect(data.result.executed).toBe(1)

    const pantryResponse = await fetch(`${API_URL}/api/pantry-items`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const pantryData = (await pantryResponse.json()) as PantryListResponse
    const yogurtItem = pantryData.result.pantryItems.find(
      (i) => i.name === 'yogurt'
    )
    expect(yogurtItem).toBeDefined()
    expect(yogurtItem?.status).toBe('running_low')
  })

  it('should fail gracefully when removing non-existing item', async () => {
    const response = await fetch(`${API_URL}/api/commands/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        actions: [{ type: 'remove_from_shopping_list', item: 'nonexistent' }],
      }),
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as CommandExecuteResponse
    expect(data.success).toBe(true)
    expect(data.result.executed).toBe(0)
    expect(data.result.failed).toBe(1)
  })
})
