import { Bool, OpenAPIRoute } from 'chanfana'
import OpenAI from 'openai'
import { z } from 'zod'
import { type AppContext, CommandAction, PantryItemStatusEnum } from '../types'
import { getDb, getHouseholdId } from '../db'

const systemPrompt = `You are a parser that extracts grocery/pantry items from natural speech. Your job is to identify items and their statuses.

Rules:
- Extract individual item names (lowercase, singular when sensible: "apples" -> "apples", "milk" -> "milk")
- Default status is "in_stock" unless the user indicates otherwise
- "running low on X" or "almost out of X" -> status: "running_low"
- "out of X" or "need X" or "need to buy X" -> status: "out_of_stock"
- Ignore filler words, just extract the items
- Return an empty array if no items are mentioned

Respond with JSON only, no explanation.`

const ParsedItems = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      status: PantryItemStatusEnum,
    })
  ),
})

const CommandParseRequest = z.object({
  command: z.string().min(1),
})

export class CommandParseEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Commands'],
    summary: 'Parse natural language into structured pantry actions',
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
        description: 'Returns parsed actions',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              result: z.object({
                actions: z.array(CommandAction),
                message: z.string().optional(),
              }),
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
        description: 'Internal server error',
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

    const openaiApiKey = c.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return c.json(
        { success: false, error: 'OpenAI API key not configured' },
        500
      )
    }

    const openai = new OpenAI({ apiKey: openaiApiKey })

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: command },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        return c.json({ success: false, error: 'No response from AI' }, 500)
      }

      const parsed = JSON.parse(content)
      const validated = ParsedItems.parse(parsed)

      const actions = validated.items.map((item) => ({
        type: 'add_to_pantry' as const,
        item: item.name,
        status: item.status,
      }))

      return c.json({
        success: true,
        result: {
          actions,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          { success: false, error: 'Failed to parse AI response' },
          500
        )
      }
      return c.json({ success: false, error: 'Failed to process command' }, 500)
    }
  }
}
