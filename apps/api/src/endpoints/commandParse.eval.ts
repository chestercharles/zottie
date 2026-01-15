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

type ActionType = 'add_to_pantry' | 'update_pantry_status' | 'remove_from_shopping_list'
type ItemStatus = 'in_stock' | 'running_low' | 'out_of_stock' | 'planned'

interface EvalCase {
  name: string
  command: string
  expectedActions: Array<{
    type: ActionType
    item: string
    status?: ItemStatus
  }>
  allowAlternateType?: ActionType
  allowAlternateItems?: string[]
  allowAlternateStatus?: ItemStatus
}

function normalizeItem(item: string): string {
  return item.toLowerCase().replace(/s$/, '')
}

function itemsMatch(actual: string, expected: string, alternates?: string[]): boolean {
  const normalizedActual = normalizeItem(actual)
  const normalizedExpected = normalizeItem(expected)

  if (normalizedActual === normalizedExpected) return true
  if (alternates?.some(alt => normalizeItem(alt) === normalizedActual)) return true

  return false
}

const evalCases: EvalCase[] = [
  // ===========================================
  // BASIC COMMANDS - Core functionality
  // ===========================================
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

  // ===========================================
  // VARIED PHRASINGS - Different ways to say "I have"
  // ===========================================
  {
    name: 'phrasing: I have X',
    command: 'I have rice',
    expectedActions: [
      { type: 'add_to_pantry', item: 'rice', status: 'in_stock' },
    ],
  },
  {
    name: 'phrasing: got some X',
    command: 'got some pasta',
    expectedActions: [
      { type: 'add_to_pantry', item: 'pasta', status: 'in_stock' },
    ],
    allowAlternateType: 'update_pantry_status',
  },
  {
    name: 'phrasing: we have X',
    command: 'we have tomatoes',
    expectedActions: [
      { type: 'add_to_pantry', item: 'tomato', status: 'in_stock' },
    ],
  },
  {
    name: 'phrasing: theres X in the pantry',
    command: 'theres flour in the pantry',
    expectedActions: [
      { type: 'add_to_pantry', item: 'flour', status: 'in_stock' },
    ],
  },
  {
    name: 'phrasing: X is in stock',
    command: 'sugar is in stock',
    expectedActions: [
      { type: 'add_to_pantry', item: 'sugar', status: 'in_stock' },
    ],
    allowAlternateType: 'update_pantry_status',
  },
  {
    name: 'phrasing: picked up X',
    command: 'picked up some chicken',
    expectedActions: [
      { type: 'add_to_pantry', item: 'chicken', status: 'in_stock' },
    ],
    allowAlternateType: 'update_pantry_status',
  },
  {
    name: 'phrasing: stocked up on X',
    command: 'stocked up on canned beans',
    expectedActions: [
      { type: 'add_to_pantry', item: 'canned bean', status: 'in_stock' },
    ],
    allowAlternateType: 'update_pantry_status',
    allowAlternateItems: ['bean', 'beans', 'canned beans'],
  },

  // ===========================================
  // PLURAL/SINGULAR VARIATIONS
  // ===========================================
  {
    name: 'plural: adds eggs (should normalize to egg)',
    command: 'add eggs',
    expectedActions: [
      { type: 'add_to_pantry', item: 'egg', status: 'in_stock' },
    ],
  },
  {
    name: 'plural: potatoes (should normalize)',
    command: 'I have potatoes',
    expectedActions: [
      { type: 'add_to_pantry', item: 'potato', status: 'in_stock' },
    ],
  },
  {
    name: 'plural: tomatoes (should normalize)',
    command: 'add tomatoes',
    expectedActions: [
      { type: 'add_to_pantry', item: 'tomato', status: 'in_stock' },
    ],
  },
  {
    name: 'plural: cherries (should normalize)',
    command: 'got cherries',
    expectedActions: [
      { type: 'add_to_pantry', item: 'cherry', status: 'in_stock' },
    ],
    allowAlternateType: 'update_pantry_status',
    allowAlternateItems: ['cherries'],
  },
  {
    name: 'singular: already singular',
    command: 'add milk',
    expectedActions: [
      { type: 'add_to_pantry', item: 'milk', status: 'in_stock' },
    ],
  },

  // ===========================================
  // INFORMAL LANGUAGE & CASUAL SPEECH
  // ===========================================
  {
    name: 'informal: gonna need X',
    command: 'gonna need more coffee',
    expectedActions: [
      { type: 'add_to_pantry', item: 'coffee', status: 'out_of_stock' },
    ],
    allowAlternateItems: ['more coffee'],
  },
  {
    name: 'informal: gotta get X',
    command: 'gotta get olive oil',
    expectedActions: [
      { type: 'add_to_pantry', item: 'olive oil', status: 'planned' },
    ],
    allowAlternateStatus: 'out_of_stock',
  },
  {
    name: 'informal: running out of X',
    command: 'running out of paper towels',
    expectedActions: [
      { type: 'add_to_pantry', item: 'paper towel', status: 'running_low' },
    ],
    allowAlternateItems: ['paper towels'],
  },
  {
    name: 'informal: almost out of X',
    command: 'almost out of dish soap',
    expectedActions: [
      { type: 'add_to_pantry', item: 'dish soap', status: 'running_low' },
    ],
  },
  {
    name: 'informal: need to grab X',
    command: 'need to grab some onions',
    expectedActions: [
      { type: 'add_to_pantry', item: 'onion', status: 'out_of_stock' },
    ],
  },
  {
    name: 'informal: low on X',
    command: 'low on cereal',
    expectedActions: [
      { type: 'add_to_pantry', item: 'cereal', status: 'running_low' },
    ],
  },
  {
    name: 'informal: fresh out of X',
    command: 'fresh out of milk',
    expectedActions: [
      { type: 'add_to_pantry', item: 'milk', status: 'out_of_stock' },
    ],
  },

  // ===========================================
  // COMPOUND ITEMS & SPECIFIC PRODUCTS
  // ===========================================
  {
    name: 'compound: olive oil',
    command: 'add olive oil',
    expectedActions: [
      { type: 'add_to_pantry', item: 'olive oil', status: 'in_stock' },
    ],
  },
  {
    name: 'compound: peanut butter',
    command: 'we have peanut butter',
    expectedActions: [
      { type: 'add_to_pantry', item: 'peanut butter', status: 'in_stock' },
    ],
  },
  {
    name: 'compound: soy sauce',
    command: 'got soy sauce',
    expectedActions: [
      { type: 'add_to_pantry', item: 'soy sauce', status: 'in_stock' },
    ],
    allowAlternateType: 'update_pantry_status',
  },
  {
    name: 'compound: ice cream',
    command: 'running low on ice cream',
    expectedActions: [
      { type: 'add_to_pantry', item: 'ice cream', status: 'running_low' },
    ],
  },
  {
    name: 'compound: greek yogurt',
    command: 'add greek yogurt',
    expectedActions: [
      { type: 'add_to_pantry', item: 'greek yogurt', status: 'in_stock' },
    ],
    allowAlternateItems: ['yogurt'],
  },

  // ===========================================
  // MULTIPLE ITEMS WITH VARIOUS SEPARATORS
  // ===========================================
  {
    name: 'multiple: comma separated',
    command: 'add milk, eggs, bread',
    expectedActions: [
      { type: 'add_to_pantry', item: 'milk', status: 'in_stock' },
      { type: 'add_to_pantry', item: 'egg', status: 'in_stock' },
      { type: 'add_to_pantry', item: 'bread', status: 'in_stock' },
    ],
  },
  {
    name: 'multiple: and separated',
    command: 'I have apples and pears and grapes',
    expectedActions: [
      { type: 'add_to_pantry', item: 'apple', status: 'in_stock' },
      { type: 'add_to_pantry', item: 'pear', status: 'in_stock' },
      { type: 'add_to_pantry', item: 'grape', status: 'in_stock' },
    ],
  },
  {
    name: 'multiple: oxford comma',
    command: 'got carrots, celery, and cucumbers',
    expectedActions: [
      { type: 'add_to_pantry', item: 'carrot', status: 'in_stock' },
      { type: 'add_to_pantry', item: 'celery', status: 'in_stock' },
      { type: 'add_to_pantry', item: 'cucumber', status: 'in_stock' },
    ],
    allowAlternateType: 'update_pantry_status',
  },
  {
    name: 'multiple: mixed status (all running low)',
    command: "we're running low on salt, pepper, and garlic",
    expectedActions: [
      { type: 'add_to_pantry', item: 'salt', status: 'running_low' },
      { type: 'add_to_pantry', item: 'pepper', status: 'running_low' },
      { type: 'add_to_pantry', item: 'garlic', status: 'running_low' },
    ],
  },

  // ===========================================
  // STATUS VARIATIONS
  // ===========================================
  {
    name: 'status: need to buy',
    command: 'need to buy lettuce',
    expectedActions: [
      { type: 'add_to_pantry', item: 'lettuce', status: 'out_of_stock' },
    ],
  },
  {
    name: 'status: all out',
    command: 'all out of ketchup',
    expectedActions: [
      { type: 'add_to_pantry', item: 'ketchup', status: 'out_of_stock' },
    ],
  },
  {
    name: 'status: need more',
    command: 'need more napkins',
    expectedActions: [
      { type: 'add_to_pantry', item: 'napkin', status: 'out_of_stock' },
    ],
    allowAlternateItems: ['napkins'],
  },
  {
    name: 'status: should get',
    command: 'should get some mustard',
    expectedActions: [
      { type: 'add_to_pantry', item: 'mustard', status: 'planned' },
    ],
  },
  {
    name: 'status: want to get',
    command: 'want to get avocados',
    expectedActions: [
      { type: 'add_to_pantry', item: 'avocado', status: 'planned' },
    ],
  },
  {
    name: 'status: thinking about getting',
    command: 'thinking about getting salmon',
    expectedActions: [
      { type: 'add_to_pantry', item: 'salmon', status: 'planned' },
    ],
  },

  // ===========================================
  // COMMON TYPOS & MISSPELLINGS
  // ===========================================
  {
    name: 'typo: brocoli (missing c)',
    command: 'add brocoli',
    expectedActions: [
      { type: 'add_to_pantry', item: 'broccoli', status: 'in_stock' },
    ],
    allowAlternateItems: ['brocoli'],
  },
  {
    name: 'typo: tomatoe (extra e)',
    command: 'I have tomatoe',
    expectedActions: [
      { type: 'add_to_pantry', item: 'tomato', status: 'in_stock' },
    ],
    allowAlternateItems: ['tomatoe'],
  },
  {
    name: 'typo: chese (missing e)',
    command: 'got some chese',
    expectedActions: [
      { type: 'add_to_pantry', item: 'cheese', status: 'in_stock' },
    ],
    allowAlternateType: 'update_pantry_status',
    allowAlternateItems: ['chese'],
  },
  {
    name: 'typo: bannana (extra n)',
    command: 'add bannana',
    expectedActions: [
      { type: 'add_to_pantry', item: 'banana', status: 'in_stock' },
    ],
    allowAlternateItems: ['bannana'],
  },

  // ===========================================
  // CASE VARIATIONS
  // ===========================================
  {
    name: 'case: ALL CAPS',
    command: 'ADD MILK',
    expectedActions: [
      { type: 'add_to_pantry', item: 'milk', status: 'in_stock' },
    ],
  },
  {
    name: 'case: Mixed Case',
    command: 'Add Chicken Breast',
    expectedActions: [
      { type: 'add_to_pantry', item: 'chicken breast', status: 'in_stock' },
    ],
    allowAlternateItems: ['chicken'],
  },
  {
    name: 'case: all lowercase',
    command: 'running low on orange juice',
    expectedActions: [
      { type: 'add_to_pantry', item: 'orange juice', status: 'running_low' },
    ],
  },

  // ===========================================
  // QUANTITY MENTIONS (should ignore quantity, extract item)
  // ===========================================
  {
    name: 'quantity: with number',
    command: 'add 2 dozen eggs',
    expectedActions: [
      { type: 'add_to_pantry', item: 'egg', status: 'in_stock' },
    ],
    allowAlternateItems: ['dozen eggs', '2 dozen eggs'],
  },
  {
    name: 'quantity: with word',
    command: 'got a gallon of milk',
    expectedActions: [
      { type: 'add_to_pantry', item: 'milk', status: 'in_stock' },
    ],
    allowAlternateType: 'update_pantry_status',
  },
  {
    name: 'quantity: some/few',
    command: 'have a few lemons',
    expectedActions: [
      { type: 'add_to_pantry', item: 'lemon', status: 'in_stock' },
    ],
  },
  {
    name: 'quantity: plenty of',
    command: 'add rice, we have plenty',
    expectedActions: [
      { type: 'add_to_pantry', item: 'rice', status: 'in_stock' },
    ],
  },

  // ===========================================
  // CONTEXT CLUES FOR STATUS
  // ===========================================
  {
    name: 'context: finished the X',
    command: 'finished the last of the coffee',
    expectedActions: [
      { type: 'add_to_pantry', item: 'coffee', status: 'out_of_stock' },
    ],
    allowAlternateType: 'update_pantry_status',
  },
  {
    name: 'context: used up X',
    command: 'used up all the flour',
    expectedActions: [
      { type: 'add_to_pantry', item: 'flour', status: 'out_of_stock' },
    ],
    allowAlternateType: 'update_pantry_status',
  },
  {
    name: 'context: just restocked X',
    command: 'just restocked the pantry with pasta',
    expectedActions: [
      { type: 'add_to_pantry', item: 'pasta', status: 'in_stock' },
    ],
    allowAlternateType: 'update_pantry_status',
  },
  {
    name: 'context: about to run out',
    command: "we're about to run out of dish soap",
    expectedActions: [
      { type: 'add_to_pantry', item: 'dish soap', status: 'running_low' },
    ],
  },

  // ===========================================
  // EMPATHY SCENARIOS - Action-first behavior
  // These test that the system takes action when users
  // mention items without explicit add commands
  // ===========================================
  {
    name: 'empathy: simple mention should add (just says item)',
    command: 'apples',
    expectedActions: [
      { type: 'add_to_pantry', item: 'apple', status: 'in_stock' },
    ],
  },
  {
    name: 'empathy: conversational mention should add',
    command: 'oh yeah we have some carrots',
    expectedActions: [
      { type: 'add_to_pantry', item: 'carrot', status: 'in_stock' },
    ],
  },
  {
    name: 'empathy: casual inventory check should add',
    command: 'so there is milk in the fridge',
    expectedActions: [
      { type: 'add_to_pantry', item: 'milk', status: 'in_stock' },
    ],
  },
  {
    name: 'empathy: statement of fact should add',
    command: 'milk bread eggs',
    expectedActions: [
      { type: 'add_to_pantry', item: 'milk', status: 'in_stock' },
      { type: 'add_to_pantry', item: 'bread', status: 'in_stock' },
      { type: 'add_to_pantry', item: 'egg', status: 'in_stock' },
    ],
  },
  {
    name: 'empathy: implicit low status from worry',
    command: "I'm worried we don't have enough butter",
    expectedActions: [
      { type: 'add_to_pantry', item: 'butter', status: 'running_low' },
    ],
  },
  {
    name: 'empathy: implicit need from meal context',
    command: 'for dinner tonight we need chicken',
    expectedActions: [
      { type: 'add_to_pantry', item: 'chicken', status: 'out_of_stock' },
    ],
  },
  {
    name: 'empathy: remembering should add',
    command: 'oh I forgot we have yogurt',
    expectedActions: [
      { type: 'add_to_pantry', item: 'yogurt', status: 'in_stock' },
    ],
  },
  {
    name: 'empathy: checking inventory should add',
    command: 'let me check... yep we have onions',
    expectedActions: [
      { type: 'add_to_pantry', item: 'onion', status: 'in_stock' },
    ],
  },
  {
    name: 'empathy: noticing should add',
    command: 'I noticed we have some leftover pasta',
    expectedActions: [
      { type: 'add_to_pantry', item: 'pasta', status: 'in_stock' },
    ],
  },
  {
    name: 'empathy: saw in pantry should add',
    command: 'saw some canned tomatoes in the pantry',
    expectedActions: [
      { type: 'add_to_pantry', item: 'canned tomato', status: 'in_stock' },
    ],
    allowAlternateItems: ['tomato', 'tomatoes', 'canned tomatoes'],
  },
  {
    name: 'empathy: partner mentioned should add',
    command: 'my wife said we have spinach',
    expectedActions: [
      { type: 'add_to_pantry', item: 'spinach', status: 'in_stock' },
    ],
  },
  {
    name: 'empathy: vague recollection should add',
    command: 'I think there might be some garlic somewhere',
    expectedActions: [
      { type: 'add_to_pantry', item: 'garlic', status: 'in_stock' },
    ],
    allowAlternateStatus: 'planned',
  },
  {
    name: 'empathy: exclamation about item should add',
    command: 'oh no, the bananas are going bad!',
    expectedActions: [
      { type: 'add_to_pantry', item: 'banana', status: 'running_low' },
    ],
    allowAlternateItems: ['bananas'],
    allowAlternateStatus: 'out_of_stock',
  },
  {
    name: 'empathy: questioning availability should still add',
    command: 'do we have any cheese left?',
    expectedActions: [
      { type: 'add_to_pantry', item: 'cheese', status: 'running_low' },
    ],
    allowAlternateStatus: 'out_of_stock',
  },
  {
    name: 'empathy: telling story about item should add',
    command: 'I used the last of the olive oil for dinner',
    expectedActions: [
      { type: 'add_to_pantry', item: 'olive oil', status: 'out_of_stock' },
    ],
    allowAlternateType: 'update_pantry_status',
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
            (a) => itemsMatch(a.item, expected.item, evalCase.allowAlternateItems)
          )
          expect(matchingAction, `Expected to find action with item matching "${expected.item}" but got: ${JSON.stringify(data.result.actions)}`).toBeDefined()

          if (evalCase.allowAlternateType) {
            expect([expected.type, evalCase.allowAlternateType]).toContain(matchingAction?.type)
          } else {
            expect(matchingAction?.type).toBe(expected.type)
          }

          if (expected.status) {
            if (evalCase.allowAlternateStatus) {
              expect([expected.status, evalCase.allowAlternateStatus]).toContain(matchingAction?.status)
            } else {
              expect(matchingAction?.status).toBe(expected.status)
            }
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

  describe('empathy: action-first behavior', () => {
    it('should take action without asking when items are mentioned', async () => {
      const response = await fetch(`${API_URL}/api/commands/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ command: 'we have milk' }),
      })

      expect(response.status).toBe(200)
      const data = (await response.json()) as CommandParseResponse
      expect(data.success).toBe(true)
      expect(data.result.actions.length).toBeGreaterThan(0)
      if (data.result.message) {
        const lowerMessage = data.result.message.toLowerCase()
        expect(lowerMessage).not.toContain('would you like')
        expect(lowerMessage).not.toContain('do you want')
        expect(lowerMessage).not.toContain('should i add')
      }
    })

    it('should never ask for confirmation when user mentions having something', async () => {
      const commands = [
        'I have eggs',
        'got some bread',
        'there is butter in the fridge',
        'we picked up some oranges',
      ]

      for (const command of commands) {
        const response = await fetch(`${API_URL}/api/commands/parse`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ command }),
        })

        expect(response.status).toBe(200)
        const data = (await response.json()) as CommandParseResponse
        expect(data.success).toBe(true)
        expect(data.result.actions.length, `Expected actions for "${command}" but got none`).toBeGreaterThan(0)
        if (data.result.message) {
          const lowerMessage = data.result.message.toLowerCase()
          expect(lowerMessage, `Message for "${command}" should not ask for confirmation`).not.toContain('would you like')
          expect(lowerMessage).not.toContain('do you want')
          expect(lowerMessage).not.toContain('should i add')
        }
      }
    })

    it('should infer status from context without explicit status keywords', async () => {
      const response = await fetch(`${API_URL}/api/commands/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ command: 'used the last of the coffee this morning' }),
      })

      expect(response.status).toBe(200)
      const data = (await response.json()) as CommandParseResponse
      expect(data.success).toBe(true)
      expect(data.result.actions.length).toBeGreaterThan(0)
      const coffeeAction = data.result.actions.find(a => a.item.includes('coffee'))
      expect(coffeeAction, 'Should have action for coffee').toBeDefined()
      expect(coffeeAction?.status).toBe('out_of_stock')
    })
  })
})
