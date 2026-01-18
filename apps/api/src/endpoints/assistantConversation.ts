import { Bool, OpenAPIRoute } from 'chanfana'
import { and, eq, gt, desc, asc } from 'drizzle-orm'
import { z } from 'zod'
import { type AppContext, PantryItemStatusEnum } from '../types'
import {
  getDb,
  getHouseholdId,
  assistantConversations,
  assistantMessages,
} from '../db'

const CONVERSATION_TTL_MS = 24 * 60 * 60 * 1000

const ProposedActionSchema = z.object({
  type: z.enum(['add_to_pantry', 'update_pantry_status']),
  item: z.string(),
  status: PantryItemStatusEnum,
})

const ProposedActionsSchema = z.object({
  actions: z.array(ProposedActionSchema),
  summary: z.string(),
})

const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  proposedActions: ProposedActionsSchema.nullable(),
  createdAt: z.string(),
})

const ConversationSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  messages: z.array(MessageSchema),
})

export class AssistantConversationGetEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Assistant'],
    summary: 'Get current active conversation for the user',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': {
        description: 'Current conversation or null if none exists',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              conversation: ConversationSchema.nullable(),
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

    const cutoffTime = new Date(Date.now() - CONVERSATION_TTL_MS)

    const [conversation] = await db
      .select()
      .from(assistantConversations)
      .where(
        and(
          eq(assistantConversations.householdId, householdId),
          eq(assistantConversations.userId, userId),
          gt(assistantConversations.updatedAt, cutoffTime)
        )
      )
      .orderBy(desc(assistantConversations.updatedAt))
      .limit(1)

    if (!conversation) {
      return c.json({ success: true, conversation: null })
    }

    const messages = await db
      .select()
      .from(assistantMessages)
      .where(eq(assistantMessages.conversationId, conversation.id))
      .orderBy(asc(assistantMessages.createdAt))

    return c.json({
      success: true,
      conversation: {
        id: conversation.id,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        messages: messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          proposedActions: msg.proposedActions
            ? JSON.parse(msg.proposedActions)
            : null,
          createdAt: msg.createdAt.toISOString(),
        })),
      },
    })
  }
}

export class AssistantConversationDeleteEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Assistant'],
    summary: 'Delete current conversation (start fresh)',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': {
        description: 'Conversation deleted successfully',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
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

    const conversations = await db
      .select({ id: assistantConversations.id })
      .from(assistantConversations)
      .where(
        and(
          eq(assistantConversations.householdId, householdId),
          eq(assistantConversations.userId, userId)
        )
      )

    for (const conv of conversations) {
      await db
        .delete(assistantMessages)
        .where(eq(assistantMessages.conversationId, conv.id))
      await db
        .delete(assistantConversations)
        .where(eq(assistantConversations.id, conv.id))
    }

    return c.json({ success: true })
  }
}
