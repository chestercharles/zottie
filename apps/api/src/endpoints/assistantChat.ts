import { Bool, OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import OpenAI from 'openai'
import { z } from 'zod'
import { type AppContext } from '../types'
import { getDb, pantryItems, getHouseholdId } from '../db'

const systemPrompt = `You are a helpful kitchen assistant for the zottie app. You help users manage their pantry inventory, plan meals, and organize their shopping.

You have access to the user's current pantry inventory. When answering questions:
- Be conversational, warm, and supportive
- Give concise, helpful answers (2-4 sentences for simple questions)
- When discussing pantry items, reference what they actually have
- For meal planning, suggest recipes based on items they have in stock
- Keep suggestions practical and achievable

Remember: This is a read-only conversation. You can answer questions and give suggestions, but you cannot take actions like adding items or changing statuses. If users want to make changes, guide them to use voice commands or the app's direct controls.`

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
      stream: true,
    })

    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content
              if (content) {
                controller.enqueue(encoder.encode(content))
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
