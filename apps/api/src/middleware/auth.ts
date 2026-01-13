import * as jose from 'jose'
import type { MiddlewareHandler } from 'hono'

const CLAIMS_NAMESPACE = 'https://zottie-api.chestercarmer.workers.dev'

interface JWTPayload {
  sub: string
  email?: string
  name?: string
  aud?: string | string[]
  iss?: string
  exp?: number
  iat?: number
  [key: string]: unknown
}

export type AuthVariables = {
  userId: string
  userEmail?: string
  userEmailVerified?: boolean
  userName?: string
  jwtPayload: JWTPayload
}

let jwksCache: jose.JWTVerifyGetKey | null = null

function getJWKS(auth0Domain: string): jose.JWTVerifyGetKey {
  if (!jwksCache) {
    const jwksUrl = `https://${auth0Domain}/.well-known/jwks.json`
    jwksCache = jose.createRemoteJWKSet(new URL(jwksUrl))
  }
  return jwksCache
}

export function authMiddleware(): MiddlewareHandler<{
  Bindings: Env
  Variables: AuthVariables
}> {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(
        { success: false, error: 'Missing or invalid Authorization header' },
        401
      )
    }

    const token = authHeader.slice(7)

    try {
      const header = jose.decodeProtectedHeader(token)

      let payload: JWTPayload

      if (header.alg === 'HS256') {
        const nodeEnv = c.env.NODE_ENV || 'production'
        const testSecret = c.env.TEST_JWT_SECRET

        if (nodeEnv === 'production') {
          return c.json(
            {
              success: false,
              error: 'HS256 tokens not accepted in production',
            },
            401
          )
        }

        if (!testSecret) {
          return c.json(
            { success: false, error: 'HS256 tokens not accepted' },
            401
          )
        }

        const secretKey = new TextEncoder().encode(testSecret)
        const { payload: verifiedPayload } = await jose.jwtVerify(
          token,
          secretKey,
          {
            algorithms: ['HS256'],
          }
        )
        payload = verifiedPayload as JWTPayload
      } else if (header.alg === 'RS256') {
        const jwks = getJWKS(c.env.AUTH0_DOMAIN)
        const { payload: verifiedPayload } = await jose.jwtVerify(token, jwks, {
          issuer: `https://${c.env.AUTH0_DOMAIN}/`,
          audience: c.env.AUTH0_AUDIENCE,
          algorithms: ['RS256'],
        })
        payload = verifiedPayload as JWTPayload
      } else {
        return c.json(
          { success: false, error: `Unsupported algorithm: ${header.alg}` },
          401
        )
      }

      if (!payload.sub) {
        return c.json({ success: false, error: 'Token missing sub claim' }, 401)
      }

      const email = (payload[`${CLAIMS_NAMESPACE}/email`] as string) || payload.email
      const emailVerified = payload[`${CLAIMS_NAMESPACE}/email_verified`] as boolean | undefined

      c.set('userId', payload.sub)
      c.set('userEmail', email)
      c.set('userEmailVerified', emailVerified)
      c.set('userName', payload.name)
      c.set('jwtPayload', payload)

      await next()
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        return c.json({ success: false, error: 'Token expired' }, 401)
      }
      if (error instanceof jose.errors.JWTClaimValidationFailed) {
        return c.json({ success: false, error: 'Token validation failed' }, 401)
      }
      console.error('JWT verification error:', error)
      return c.json({ success: false, error: 'Invalid token' }, 401)
    }
  }
}
