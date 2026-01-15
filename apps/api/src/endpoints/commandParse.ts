import { Bool, OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import OpenAI from 'openai'
import { z } from 'zod'
import {
  type AppContext,
  CommandAction,
  CommandParseRequest,
  CommandParseResponse,
  PantryItem,
} from '../types'
import { getDb, pantryItems, getHouseholdId } from '../db'

const systemPrompt = `You are a kitchen inventory assistant that parses natural language commands into structured actions.

CORE PRINCIPLE: Always assume the user wants to take action when they mention items. Be empathetic and action-oriented. Never ask if they want to add something - just add it. Users feel smart and capable when their intent is understood without explicit commands.

The user has a pantry with items that can have these statuses:
- "in_stock": Item is available
- "running_low": Supply is low, might need to buy soon
- "out_of_stock": Need to buy
- "planned": Planning to get this item

You need to parse the user's command and return a list of actions. Each action should be one of:

1. "add_to_pantry" - Add a new item to the pantry
   - Use this when user mentions having an item or wants to add something
   - Include a "status" field (default to "in_stock" unless user implies otherwise)

2. "update_pantry_status" - Update an existing item's status
   - Use this when item exists in pantry and user wants to change its status
   - Always include a "status" field

3. "remove_from_shopping_list" - Remove an item from shopping consideration
   - Use this when user says they don't need to buy something anymore
   - This sets status to "in_stock" (they have it now)

EMPATHETIC INTENT RECOGNITION - Always take action when users mention items:
- "I have X" / "got X" / "we have X" / "there's X" → add_to_pantry with "in_stock"
- "picked up X" / "bought X" / "just got X" → add_to_pantry with "in_stock"
- "almost out of X" / "running low on X" / "low on X" / "about to run out" → add_to_pantry with "running_low"
- "out of X" / "need X" / "need to buy X" / "fresh out of X" / "all out of X" → add_to_pantry with "out_of_stock"
- "planning to get X" / "want to get X" / "thinking about getting X" / "should get X" → add_to_pantry with "planned"
- "used up X" / "finished X" / "ran out of X" → add_to_pantry with "out_of_stock"
- "stocked up on X" / "restocked X" / "plenty of X" → add_to_pantry with "in_stock"

NEVER return a message asking "would you like me to add X?" - just add it. The user mentioned the item because they want it tracked.

Be smart about user intent:
- If user says "mark X as running low" but X isn't in their pantry, use "add_to_pantry" with status "running_low"
- If user says "I just bought X", use "update_pantry_status" with status "in_stock" if item exists, otherwise "add_to_pantry"
- If user says "we're out of X" or "need X", use "update_pantry_status" with status "out_of_stock" if exists, otherwise "add_to_pantry"
- Normalize item names to lowercase singular form (e.g., "Apples" -> "apple", "Milk" -> "milk")

Return a JSON object with:
- "actions": an array of actions (can be empty ONLY if no pantry/food items are mentioned)
- "message": (optional) a helpful message - ONLY include if actions array is empty

Each action has:
- "type": one of the action types above
- "item": the item name (lowercase, singular)
- "status": the status to set (required for add_to_pantry and update_pantry_status)

WHEN TO RETURN EMPTY ACTIONS:
Only return an empty actions array when the user's input contains NO food/pantry items at all. Examples:
- "what's the weather" - no items mentioned
- "hello" - no items mentioned
- "remind me to call mom" - no items mentioned

If the user mentions ANY food or household item, ALWAYS create an action for it - even if the phrasing is unusual.

If you cannot identify any pantry or shopping list actions from the user's input, return an empty actions array and include a helpful, empathetic message that:
1. References what the user actually said to show you understood their input
2. Gently explains this is a pantry/shopping assistant
3. Provides a specific, contextual recommendation
4. Uses a warm, supportive tone
5. IMPORTANT: Keep it short - two sentences maximum

Examples:
- User says "what's the weather": {"actions": [], "message": "I can't check the weather, but I can help with your pantry and shopping list. Try saying 'add milk' or 'mark eggs as running low'."}
- User says "hello": {"actions": [], "message": "Hi! I'm here to help manage your pantry and shopping list. Try telling me to 'add apples' or 'mark bread as out of stock'."}
- User says "remind me to call mom": {"actions": [], "message": "I can't set reminders, but I can track your pantry items. Try saying 'add tomatoes' or 'we're out of pasta'."}

Make the message personal by referencing their specific input when possible.`

export class CommandParseEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Commands'],
    summary: 'Parse a natural language command into structured actions',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CommandParseRequest,
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Returns the parsed actions',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              result: CommandParseResponse,
            }),
          },
        },
      },
      '401': {
        description: 'Unauthorized - no valid authentication provided',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              error: z.string(),
            }),
          },
        },
      },
      '403': {
        description: 'Forbidden - user must join a household first',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              error: z.string(),
            }),
          },
        },
      },
      '500': {
        description: 'Internal server error - failed to parse command',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              error: z.string(),
            }),
          },
        },
      },
    },
  }

  async handle(c: AppContext) {
    const userId = c.get('userId')
    const db = getDb(c.env.db)

    const householdId = await getHouseholdId(db, userId)

    if (!householdId) {
      return c.json(
        { success: false, error: 'User must join a household first' },
        403
      )
    }

    const data = await this.getValidatedData<typeof this.schema>()
    const { command } = data.body

    const items = await db
      .select()
      .from(pantryItems)
      .where(eq(pantryItems.householdId, householdId))

    const pantryContext =
      items.length > 0
        ? `Current pantry items:\n${items.map((item) => `- ${item.name} (${item.status})`).join('\n')}`
        : 'The pantry is currently empty.'

    const openaiApiKey = c.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return c.json(
        { success: false, error: 'OpenAI API key not configured' },
        500
      )
    }

    const openai = new OpenAI({ apiKey: openaiApiKey })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `${pantryContext}\n\nUser command: "${command}"`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })

    const responseText = completion.choices[0]?.message?.content

    if (!responseText) {
      return c.json(
        {
          success: false,
          error: 'Failed to parse command - no response from AI',
        },
        500
      )
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(responseText)
    } catch {
      return c.json(
        {
          success: false,
          error: 'Failed to parse command - invalid JSON response',
        },
        500
      )
    }

    const actionsSchema = z.object({
      actions: z.array(
        z.object({
          type: z.enum([
            'add_to_pantry',
            'update_pantry_status',
            'remove_from_shopping_list',
          ]),
          item: z.string(),
          status: z
            .enum(['in_stock', 'running_low', 'out_of_stock', 'planned'])
            .optional(),
        })
      ),
      message: z.string().optional(),
    })

    const result = actionsSchema.safeParse(parsed)

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: 'Failed to parse command - unexpected response format',
        },
        500
      )
    }

    return {
      success: true,
      result: {
        actions: result.data.actions,
        message: result.data.message,
      },
    }
  }
}
