import { Bool, OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import OpenAI from 'openai'
import { z } from 'zod'
import { type AppContext, PantryItemStatusEnum } from '../types'
import { getDb, pantryItems, getHouseholdId } from '../db'

const systemPrompt = `You are a friendly kitchen assistant for zottie.

Keep responses SHORT - just 1-2 sentences max. Be warm and helpful but brief. Never use markdown formatting (no asterisks, bullet points, headers, or code blocks). Write in plain conversational text only.

You know the user's pantry inventory. Reference what they have when relevant. For meal ideas, suggest simple options based on their items.

When users want changes, use the propose_pantry_actions tool. Be proactive - if they mention being out of something, propose marking it. If they want to add items, propose adding them.`

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

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

const AssistantChatRequest = z.object({
  message: z.string().min(1),
  history: z.array(MessageSchema).optional(),
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
    const { message, history = [] } = data.body

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

    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      [
        {
          role: 'system',
          content: `${systemPrompt}\n\n${pantryContext}`,
        },
      ]

    for (const msg of history) {
      openaiMessages.push({
        role: msg.role,
        content: msg.content,
      })
    }

    openaiMessages.push({
      role: 'user',
      content: message,
    })

    const openai = new OpenAI({ apiKey: openaiApiKey })

    const stream = await openai.chat.completions.create({
      model: 'gpt-5.2-chat-latest',
      messages: openaiMessages,
      tools,
      stream: true,
    })

    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()
          let toolCallBuffer = ''

          try {
            for await (const chunk of stream) {
              const choice = chunk.choices[0]

              if (choice?.delta?.tool_calls) {
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

function formatItemWithPurchaseDate(item: {
  name: string
  purchasedAt: Date | null
}): string {
  if (!item.purchasedAt) {
    return item.name
  }
  const daysAgo = Math.floor(
    (Date.now() - item.purchasedAt.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysAgo === 0) {
    return `${item.name} (purchased today)`
  } else if (daysAgo === 1) {
    return `${item.name} (purchased yesterday)`
  } else if (daysAgo < 7) {
    return `${item.name} (purchased ${daysAgo} days ago)`
  } else if (daysAgo < 14) {
    return `${item.name} (purchased 1 week ago)`
  } else if (daysAgo < 30) {
    const weeks = Math.floor(daysAgo / 7)
    return `${item.name} (purchased ${weeks} weeks ago)`
  } else {
    const months = Math.floor(daysAgo / 30)
    return `${item.name} (purchased ${months} month${months > 1 ? 's' : ''} ago)`
  }
}

function buildPantryContext(
  items: Array<{
    name: string
    status: string
    purchasedAt: Date | null
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
      `In stock (${inStock.length}): ${inStock.map((i) => formatItemWithPurchaseDate(i)).join(', ')}`
    )
  }
  if (runningLow.length > 0) {
    sections.push(
      `Running low (${runningLow.length}): ${runningLow.map((i) => formatItemWithPurchaseDate(i)).join(', ')}`
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
