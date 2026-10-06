import { getIronSession, IronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import * as openid from 'openid-client'

import { createCustomFetch, getClientConfigPromise } from './clientConfig'
import { discover, mtlsEndpoint } from './discovery'

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

  console.log(
    'Discovering authorization server metadata for',
    clientConfig.server.href,
  )
  const issuer = await discover(clientConfig.server, clientConfig.client_id)
  console.log('Discovery successful:', {
    issuer: issuer.serverMetadata().issuer,
    par: mtlsEndpoint(issuer, 'pushed_authorization_request_endpoint'),
    token: mtlsEndpoint(issuer, 'token_endpoint'),
  })

  return issuer
}

export async function generateAuthUrl(
  session: IronSession<SessionData>,
): Promise<string> {
  const clientConfig = await getClientConfigPromise()
  const customFetch = await createCustomFetch()
  const config = await getClientConfig()

  const code_verifier = openid.randomPKCECodeVerifier()
  const code_challenge = await openid.calculatePKCECodeChallenge(code_verifier)
  const state = openid.randomState()

  // Kept for the callback: the verifier for the token exchange, and the state
  // to check the authorization response against
  session.code_verifier = code_verifier
  session.state = state
  await session.save()

  // openid-client's buildAuthorizationUrlWithPAR would send the PAR request
  // with its own fetch, not the mTLS one, so the request is made here
  const parEndpoint = mtlsEndpoint(
    config,
    'pushed_authorization_request_endpoint',
  )
  console.log('Making PAR request to', parEndpoint)

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
      state,
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

  const authEndpoint = config.serverMetadata().authorization_endpoint
  if (!authEndpoint) throw new Error('Authorization endpoint not found')

  const authUrl = new URL(authEndpoint)
  authUrl.searchParams.set('client_id', clientConfig.client_id)
  authUrl.searchParams.set('request_uri', parData.request_uri)

  console.log('Generated authorization URL with PAR:', authUrl.href)

  return authUrl.href
}
