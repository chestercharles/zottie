import * as jose from 'jose'

const CLAIMS_NAMESPACE = 'https://zottie-api.chestercarmer.workers.dev'

interface TestTokenOptions {
  userId: string
  email?: string
  emailVerified?: boolean
  expiresIn?: string
}

export async function createTestToken(options: TestTokenOptions): Promise<string> {
  const { userId, email, emailVerified, expiresIn = '1h' } = options

  const testSecret = process.env.TEST_JWT_SECRET
  if (!testSecret) {
    throw new Error(
      'TEST_JWT_SECRET environment variable is not set. ' +
      'Set it in your .dev.vars file or test environment.'
    )
  }

  const secret = new TextEncoder().encode(testSecret)

  const payload: Record<string, unknown> = { sub: userId }
  if (email) payload[`${CLAIMS_NAMESPACE}/email`] = email
  if (emailVerified !== undefined) payload[`${CLAIMS_NAMESPACE}/email_verified`] = emailVerified

  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret)

  return token
}
