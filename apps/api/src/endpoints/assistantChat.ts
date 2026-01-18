import { Bool, OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import OpenAI from 'openai'
import { z } from 'zod'
import { type AppContext, PantryItemStatusEnum } from '../types'
import { getDb, pantryItems, getHouseholdId } from '../db'

const systemPrompt = `You are a helpful kitchen assistant for the zottie app. You help users manage their pantry inventory, plan meals, and organize their shopping.

You have access to the user's current pantry inventory. When answering questions:
- Be conversational, warm, and supportive
- Give concise, helpful answers (2-4 sentences for simple questions)
- When discussing pantry items, reference what they actually have
- For meal planning, suggest recipes based on items they have in stock
- Keep suggestions practical and achievable

When users want to make changes to their pantry or shopping list, use the available tools to propose actions. You can:
- Add items to the pantry (they'll start as in stock)
- Mark items as running low, out of stock, or in stock
- Add items to the shopping list (by setting status to "planned" or "out_of_stock")

Always be proactive about helping users take action. If someone says "we're out of milk", propose marking milk as out of stock. If they say "add eggs", propose adding eggs to the pantry.`

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'propose_pantry_actions',
      description:
        'Propose actions to modify the pantry. Use this when the user wants to add items, update statuses, or manage their shopping list. The user will see a preview and can approve or reject the changes.',
      parameters: {
        type: 'object',
        properties: {
          actions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['add_to_pantry', 'update_pantry_status'],
                  description:
                    'add_to_pantry: adds a new item or updates existing. update_pantry_status: changes the status of an existing item.',
                },
                item: {
                  type: 'string',
                  description:
                    'The name of the item (lowercase, e.g. "milk", "eggs")',
                },
                status: {
                  type: 'string',
                  enum: ['in_stock', 'running_low', 'out_of_stock', 'planned'],
                  description:
                    'The status to set. Use "out_of_stock" or "planned" to add to shopping list.',
                },
              },
              required: ['type', 'item', 'status'],
            },
            description: 'List of actions to propose',
          },
          summary: {
            type: 'string',
            description:
              'A brief, friendly summary of what changes will be made (e.g. "I\'ll add milk and eggs to your shopping list")',
          },
        },
        required: ['actions', 'summary'],
      },
    },
  },
]

const ProposedAction = z.object({
  type: z.enum(['add_to_pantry', 'update_pantry_status']),
  item: z.string(),
  status: PantryItemStatusEnum,
})

const ToolCallResult = z.object({
  actions: z.array(ProposedAction),
  summary: z.string(),
})

const AssistantChatRequest = z.object({
  message: z.string().min(1),
})

export class AssistantChatEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Assistant'],
    summary: 'Stream a chat response from the assistant',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: AssistantChatRequest,
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Streaming text response',
        content: {
          'text/event-stream': {
            schema: z.string(),
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
    const { message } = data.body

    const items = await db
      .select()
      .from(pantryItems)
      .where(eq(pantryItems.householdId, householdId))

    const pantryContext = buildPantryContext(items)

    const openaiApiKey = c.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return c.json(
        { success: false, error: 'OpenAI API key not configured' },
        500
      )
    }

    const openai = new OpenAI({ apiKey: openaiApiKey })

    const stream = await openai.chat.completions.create({
      model: 'gpt-5.2-chat-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `${pantryContext}\n\nUser message: "${message}"`,
        },
      ],
      tools,
      stream: true,
    })

    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()
          let toolCallBuffer = ''
          let isToolCall = false

          try {
            for await (const chunk of stream) {
              const choice = chunk.choices[0]

              if (choice?.delta?.tool_calls) {
                isToolCall = true
                const toolCall = choice.delta.tool_calls[0]
                if (toolCall?.function?.arguments) {
                  toolCallBuffer += toolCall.function.arguments
                }
              } else if (choice?.delta?.content) {
                controller.enqueue(encoder.encode(choice.delta.content))
              }

              if (choice?.finish_reason === 'tool_calls' && toolCallBuffer) {
                try {
                  const parsed = JSON.parse(toolCallBuffer)
                  const validated = ToolCallResult.parse(parsed)
                  controller.enqueue(
                    encoder.encode(
                      `\n[PROPOSED_ACTIONS]${JSON.stringify(validated)}`
                    )
                  )
                } catch {
                  // If parsing fails, just ignore the tool call
                }
              }
            }
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      }
    )
  }
}

function buildPantryContext(
  items: Array<{
    name: string
    status: string
  }>
): string {
  if (items.length === 0) {
    return 'Current pantry: The user has not added any items to their pantry yet.'
  }

  const inStock = items.filter((i) => i.status === 'in_stock')
  const runningLow = items.filter((i) => i.status === 'running_low')
  const outOfStock = items.filter((i) => i.status === 'out_of_stock')
  const planned = items.filter((i) => i.status === 'planned')

  const sections: string[] = []

  if (inStock.length > 0) {
    sections.push(
      `In stock (${inStock.length}): ${inStock.map((i) => i.name).join(', ')}`
    )
  }
  if (runningLow.length > 0) {
    sections.push(
      `Running low (${runningLow.length}): ${runningLow.map((i) => i.name).join(', ')}`
    )
  }
  if (outOfStock.length > 0) {
    sections.push(
      `Out of stock (${outOfStock.length}): ${outOfStock.map((i) => i.name).join(', ')}`
    )
  }
  if (planned.length > 0) {
    sections.push(
      `Planned (${planned.length}): ${planned.map((i) => i.name).join(', ')}`
    )
  }

  return `Current pantry inventory:\n${sections.join('\n')}`
}
