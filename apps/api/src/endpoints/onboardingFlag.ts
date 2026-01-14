import { Bool, OpenAPIRoute } from 'chanfana'
import { z } from 'zod'
import { type AppContext, OnboardingFlagResponse } from '../types'

export class OnboardingFlagEndpoint extends OpenAPIRoute {
  schema = {
    tags: ['Onboarding'],
    summary: 'Get the onboarding experience flag',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': {
        description: 'Returns which onboarding experience to show',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              result: OnboardingFlagResponse,
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
    },
  }

  async handle(c: AppContext) {
    const flag = await this.readFlagFromFile(c)

    return {
      success: true,
      result: {
        flag,
      },
    }
  }

  private async readFlagFromFile(
    c: AppContext
  ): Promise<'original' | 'conversational'> {
    try {
      if (!c.env.ASSETS) {
        return 'original'
      }

      const response = await c.env.ASSETS.fetch(
        new URL('/onboarding-flag.txt', c.req.url)
      )

      if (!response.ok) {
        return 'original'
      }

      const content = await response.text()
      const trimmed = content.trim().toLowerCase()

      if (trimmed === 'conversational') {
        return 'conversational'
      }

      return 'original'
    } catch {
      return 'original'
    }
  }
}
