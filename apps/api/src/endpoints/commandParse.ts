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

The user has a pantry with items that can have these statuses:
- "in_stock": Item is available
- "running_low": Supply is low, might need to buy soon
- "out_of_stock": Need to buy
- "planned": Planning to get this item

You need to parse the user's command and return a list of actions. Each action should be one of:

1. "add_to_pantry" - Add a new item to the pantry
   - Use this when user wants to add something new
   - Include a "status" field (default to "in_stock" unless user implies otherwise)

2. "update_pantry_status" - Update an existing item's status
   - Use this when user wants to mark something as running low, out of stock, etc.
   - Always include a "status" field

3. "remove_from_shopping_list" - Remove an item from shopping consideration
   - Use this when user says they don't need to buy something anymore
   - This sets status to "in_stock" (they have it now)

Be smart about user intent:
- If user says "mark X as running low" but X isn't in their pantry, use "add_to_pantry" with status "running_low"
- If user says "I just bought X", use "update_pantry_status" with status "in_stock"
- If user says "we're out of X" or "need X", use "update_pantry_status" with status "out_of_stock" (or "add_to_pantry" if not in pantry)
- Normalize item names to lowercase singular form (e.g., "Apples" -> "apple", "Milk" -> "milk")

Return a JSON object with:
- "actions": an array of actions (can be empty if no valid actions found)
- "message": (optional) a helpful message to display to the user

Each action has:
- "type": one of the action types above
- "item": the item name (lowercase, singular)
- "status": the status to set (required for add_to_pantry and update_pantry_status)

If you cannot identify any pantry or shopping list actions from the user's input, return an empty actions array and include a helpful, empathetic message that:
1. References what the user actually said to show you understood their input
2. Explains why you couldn't process it as a pantry/shopping action
3. Provides a specific, contextual recommendation based on what they might have meant
4. Uses a validating, supportive tone without being patronizing
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
