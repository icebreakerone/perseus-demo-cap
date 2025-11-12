import { getIronSession, IronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import * as openid from 'openid-client'

import { createCustomFetch, getClientConfigPromise } from './clientConfig'

export { initializeClientConfig, createCustomFetch } from './clientConfig'
export type { IClientConfig, ICertificates } from './clientConfig'

export interface SessionData {
  isLoggedIn: boolean
  access_token?: string
  code_verifier?: string
  state?: string
  tenantId?: string
}

export const getSessionOptions = (): SessionOptions => {
  const password = process.env.SECRET_COOKIE_PASSWORD
  if (!password)
    throw new Error('SECRET_COOKIE_PASSWORD environment variable is missing')

  return {
    password,
    cookieName: 'iron-session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
    },
  }
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(
    cookieStore,
    getSessionOptions(),
  )

  if (!session.isLoggedIn) session.isLoggedIn = defaultSession.isLoggedIn

  return session
}

export async function getClientConfig() {
  const clientConfig = await getClientConfigPromise()

  console.log('clientConfig.server', clientConfig.server)
  console.log('Attempting OAuth discovery (non-mTLS endpoint)...')

  // Discovery endpoint is NOT mTLS protected - use regular fetch
  const issuer = await openid.discovery(
    new URL('/.well-known/oauth-authorization-server', clientConfig.server),
    clientConfig.client_id,
    { use_mtls_endpoint_aliases: true },
  )

  console.log('Discovery successful - found mTLS endpoints:', {
    par: issuer.serverMetadata().pushed_authorization_request_endpoint,
    token: issuer.serverMetadata().token_endpoint,
  })

  console.log('Server metadata PAR requirements:', {
    require_pushed_authorization_requests:
      issuer.serverMetadata().require_pushed_authorization_requests,
    pushed_authorization_request_endpoint:
      issuer.serverMetadata().pushed_authorization_request_endpoint,
  })

  return issuer
}

export async function generateAuthUrl(
  session: IronSession<SessionData>,
): Promise<string> {
  const clientConfig = await getClientConfigPromise()
  const customFetch = await createCustomFetch()
  const config = await getClientConfig()

  // Generate PKCE code verifier and challenge
  const code_verifier = openid.randomPKCECodeVerifier()
  const code_challenge = await openid.calculatePKCECodeChallenge(code_verifier)

  // Store code_verifier in session for later token exchange
  session.code_verifier = code_verifier
  await session.save()

  console.log('Generating authorization URL with PAR...')
  console.log(
    'PAR endpoint:',
    config.serverMetadata().pushed_authorization_request_endpoint,
  )
  console.log('Auth endpoint:', config.serverMetadata().authorization_endpoint)

  // Manual PAR implementation since buildAuthorizationUrl doesn't handle it automatically
  console.log('Making PAR request...')

  const parEndpoint =
    config.serverMetadata().pushed_authorization_request_endpoint
  if (!parEndpoint) throw new Error('PAR endpoint not found in server metadata')

  const parResponse = await customFetch(parEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientConfig.client_id,
      redirect_uri: clientConfig.redirect_uri,
      response_type: 'code',
      scope: clientConfig.scope,
      code_challenge,
      code_challenge_method: 'S256',
    }).toString(),
  })

  if (!parResponse.ok) {
    const errorText = await parResponse.text()
    throw new Error(
      `PAR request failed: ${parResponse.status} ${parResponse.statusText} - ${errorText}`,
    )
  }

  const parData = await parResponse.json()
  console.log('PAR response:', parData)

  if (!parData.request_uri) throw new Error('No request_uri in PAR response')

  // Build authorization URL with request_uri
  const authEndpoint = config.serverMetadata().authorization_endpoint
  if (!authEndpoint) throw new Error('Authorization endpoint not found')

  const authUrl = new URL(authEndpoint)
  authUrl.searchParams.set('client_id', clientConfig.client_id)
  authUrl.searchParams.set('request_uri', parData.request_uri)

  console.log('Generated authorization URL with PAR:', authUrl.href)
  console.log('Request URI:', parData.request_uri)

  return authUrl.href
}
