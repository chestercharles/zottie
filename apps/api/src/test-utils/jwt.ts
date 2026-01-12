import * as jose from 'jose'

interface TestTokenOptions {
  userId: string
  expiresIn?: string
}

export async function createTestToken(options: TestTokenOptions): Promise<string> {
  const { userId, expiresIn = '1h' } = options

  const testSecret = process.env.TEST_JWT_SECRET
  if (!testSecret) {
    throw new Error(
      'TEST_JWT_SECRET environment variable is not set. ' +
      'Set it in your .dev.vars file or test environment.'
    )
  }

  const secret = new TextEncoder().encode(testSecret)

  const token = await new jose.SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret)

  return token
}
