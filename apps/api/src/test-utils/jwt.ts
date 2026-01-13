import * as jose from 'jose'

interface TestTokenOptions {
  userId: string
  email?: string
  name?: string
  expiresIn?: string
}

export async function createTestToken(options: TestTokenOptions): Promise<string> {
  const { userId, email, name, expiresIn = '1h' } = options

  const testSecret = process.env.TEST_JWT_SECRET
  if (!testSecret) {
    throw new Error(
      'TEST_JWT_SECRET environment variable is not set. ' +
      'Set it in your .dev.vars file or test environment.'
    )
  }

  const secret = new TextEncoder().encode(testSecret)

  const payload: Record<string, unknown> = { sub: userId }
  if (email) payload.email = email
  if (name) payload.name = name

  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret)

  return token
}
