import { describe, it, expect, beforeAll } from 'vitest'
import { createTestToken } from '../test-utils/jwt'

const API_URL = 'http://localhost:8787'

interface CommandParseResponse {
  success: boolean
  result: {
    actions: Array<{
      type: 'add_to_pantry' | 'update_pantry_status' | 'remove_from_shopping_list'
      item: string
      status?: 'in_stock' | 'running_low' | 'out_of_stock' | 'planned'
    }>
    message?: string
  }
}

interface EvalCase {
  name: string
  command: string
  expectedActions: Array<{
    type: 'add_to_pantry' | 'update_pantry_status' | 'remove_from_shopping_list'
    item: string
    status?: 'in_stock' | 'running_low' | 'out_of_stock' | 'planned'
  }>
  allowAlternateType?: 'add_to_pantry' | 'update_pantry_status' | 'remove_from_shopping_list'
}

const evalCases: EvalCase[] = [
  {
    name: 'add single item to pantry',
    command: 'add milk to the pantry',
    expectedActions: [
      { type: 'add_to_pantry', item: 'milk', status: 'in_stock' },
    ],
  },
  {
    name: 'add item with running low status',
    command: "we're running low on eggs",
    expectedActions: [
      { type: 'add_to_pantry', item: 'egg', status: 'running_low' },
    ],
  },
  {
    name: 'mark item as out of stock',
    command: "we're out of bread",
    expectedActions: [
      { type: 'add_to_pantry', item: 'bread', status: 'out_of_stock' },
    ],
  },
  {
    name: 'add multiple items',
    command: 'add apples, bananas, and oranges',
    expectedActions: [
      { type: 'add_to_pantry', item: 'apple', status: 'in_stock' },
      { type: 'add_to_pantry', item: 'banana', status: 'in_stock' },
      { type: 'add_to_pantry', item: 'orange', status: 'in_stock' },
    ],
  },
  {
    name: 'mark as just bought',
    command: 'I just bought some cheese',
    expectedActions: [
      { type: 'add_to_pantry', item: 'cheese', status: 'in_stock' },
    ],
    allowAlternateType: 'update_pantry_status',
  },
  {
    name: 'plan to get item',
    command: 'planning to get butter',
    expectedActions: [
      { type: 'add_to_pantry', item: 'butter', status: 'planned' },
    ],
  },
]

describe('Command Parse Endpoint Eval', () => {
  let token: string
  const userId = `auth0|eval-user-${Date.now()}`

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
      body: JSON.stringify({ name: 'Eval Test Household' }),
    })
  })

  describe('schema validation', () => {
    it('should return valid action schema structure', async () => {
      const response = await fetch(`${API_URL}/api/commands/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ command: 'add some test item' }),
      })

      expect(response.status).toBe(200)
      const data = (await response.json()) as CommandParseResponse
      expect(data.success).toBe(true)
      expect(data.result).toBeDefined()
      expect(Array.isArray(data.result.actions)).toBe(true)

      for (const action of data.result.actions) {
        expect(['add_to_pantry', 'update_pantry_status', 'remove_from_shopping_list']).toContain(action.type)
        expect(typeof action.item).toBe('string')
        expect(action.item.length).toBeGreaterThan(0)
        if (action.status) {
          expect(['in_stock', 'running_low', 'out_of_stock', 'planned']).toContain(action.status)
        }
      }
    })
  })

  describe('expected output validation', () => {
    for (const evalCase of evalCases) {
      it(`should correctly parse: ${evalCase.name}`, async () => {
        const response = await fetch(`${API_URL}/api/commands/parse`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ command: evalCase.command }),
        })

        expect(response.status).toBe(200)
        const data = (await response.json()) as CommandParseResponse
        expect(data.success).toBe(true)

        expect(data.result.actions.length).toBe(evalCase.expectedActions.length)

        for (const expected of evalCase.expectedActions) {
          const matchingAction = data.result.actions.find(
            (a) => a.item === expected.item || a.item === expected.item.replace(/s$/, '')
          )
          expect(matchingAction).toBeDefined()

          if (evalCase.allowAlternateType) {
            expect([expected.type, evalCase.allowAlternateType]).toContain(matchingAction?.type)
          } else {
            expect(matchingAction?.type).toBe(expected.type)
          }

          if (expected.status) {
            expect(matchingAction?.status).toBe(expected.status)
          }
        }
      })
    }
  })

  describe('empathetic error responses', () => {
    it('should return empty actions with helpful message for unrelated commands', async () => {
      const response = await fetch(`${API_URL}/api/commands/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ command: "what's the weather today" }),
      })

      expect(response.status).toBe(200)
      const data = (await response.json()) as CommandParseResponse
      expect(data.success).toBe(true)
      expect(data.result.actions).toHaveLength(0)
      expect(data.result.message).toBeDefined()
      expect(typeof data.result.message).toBe('string')
      expect(data.result.message!.length).toBeGreaterThan(0)
    })

    it('should return empty actions with helpful message for vague commands', async () => {
      const response = await fetch(`${API_URL}/api/commands/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ command: 'hello there' }),
      })

      expect(response.status).toBe(200)
      const data = (await response.json()) as CommandParseResponse
      expect(data.success).toBe(true)
      expect(data.result.actions).toHaveLength(0)
      expect(data.result.message).toBeDefined()
      expect(typeof data.result.message).toBe('string')
      expect(data.result.message!.length).toBeGreaterThan(0)
    })
  })
})
