import { getIronSession, IronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import * as openid from 'openid-client'
import * as undici from 'undici'
import { readFileSync } from 'fs'
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager'

interface ICertificates {
  mtlsKey: string
  mtlsBundle: string
}

interface IClientConfig extends ICertificates {
  server: URL
  client_id: string
  redirect_uri: string
  scope: string
  response_type: string
  grant_type: string
  post_login_route: string
  code_challenge_method: string
  protectedResourceUrl: URL
}

export interface SessionData {
  isLoggedIn: boolean
  access_token?: string
  code_verifier?: string
  state?: string
  tenantId?: string
}

const resolveAppEnv = () => {
  const value = process.env.APP_ENV ?? process.env.ENVIRONMENT

  if (!value) {
    console.warn(
      'APP_ENV environment variable is missing; defaulting to "local"',
    )
    return 'local'
  }

  return value
}

const isLocalEnv = () => resolveAppEnv() === 'local'

// Define a function to load certificates in development (local files)
const loadCertificatesFromLocal = (): ICertificates => {
  const mtlsKeyPath = './certs/cap-demo-certs/cap-demo-key.pem'
  const mtlsBundlePath = './certs/cap-demo-certs/cap-demo-bundle.pem' // leaf + intermediate

  console.log('Loading certificates from:', mtlsKeyPath, mtlsBundlePath)

  const mtlsKey = readFileSync(mtlsKeyPath, 'utf8')
  const mtlsBundle = readFileSync(mtlsBundlePath, 'utf8')

  console.log('Key length:', mtlsKey.length)
  console.log('Cert length:', mtlsBundle.length)
  console.log('Key starts with:', mtlsKey.substring(0, 50))
  console.log('Cert starts with:', mtlsBundle.substring(0, 50))

  return {
    mtlsKey,
    mtlsBundle,
  }
}

// Define a function to load certificates from AWS Secrets Manager in production
const loadCertificatesFromSecretsManager = async (): Promise<ICertificates> => {
  const secretsManager = new SecretsManagerClient({ region: 'eu-west-2' })
  const secretName = `${resolveAppEnv()}/perseus-demo-cap/mtls-key-bundle`
  console.log('Loading certificates from AWS Secrets Manager:', secretName)
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName })
    const data = await secretsManager.send(command)
    const secret = data.SecretString ? JSON.parse(data.SecretString) : null
    if (!secret)
      throw new Error('Secret is empty or not in the expected format.')

    // Support older payloads that used mtlsBundle instead of mtlsBundle
    const mtlsBundle: string = secret.mtlsBundle || secret.mtlsBundle
    if (!mtlsBundle)
      throw new Error('Secret missing mtlsBundle (or mtlsBundle)')

    return {
      mtlsKey: secret.mtlsKey,
      mtlsBundle,
    }
  } catch (error) {
    console.error('Error retrieving certificates from Secrets Manager:', error)
    throw error
  }
}

// Function to initialize clientConfig asynchronously
export const initializeClientConfig = async (): Promise<IClientConfig> => {
  let certificates: ICertificates

  if (isLocalEnv())
    try {
      certificates = loadCertificatesFromLocal()
      console.log('Successfully loaded certificates from local files')
    } catch (error) {
      console.error('Failed to load certificates from local files:', error)
      console.log('Falling back to AWS Secrets Manager...')
      certificates = await loadCertificatesFromSecretsManager()
    }
  else certificates = await loadCertificatesFromSecretsManager()

  return {
    server: new URL('https://preprod.perseus-demo-authentication.ib1.org'), // Non-mTLS endpoint for discovery
    client_id: process.env.NEXT_PUBLIC_CLIENT_ID as string,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    mtlsKey: certificates.mtlsKey,
    mtlsBundle: certificates.mtlsBundle,
    scope:
      'https://registry.core.pilot.trust.ib1.org/scheme/perseus/license/energy-consumption-data/2024-12-05+offline_access',
    response_type: 'code',
    grant_type: 'authorization_code',
    // post_login_route: process.env.NEXT_PUBLIC_APP_URL as string,
    post_login_route: process.env.NEXT_PUBLIC_REDIRECT_URL as string,
    code_challenge_method: 'S256',
    protectedResourceUrl: new URL(
      'https://preprod.perseus-demo-energy.ib1.org/datasources/id/measure?from=2024-12-05T00:00:00Z&to=2024-12-06T00:00:00Z',
    ),
  }
}

let clientConfigPromise: Promise<IClientConfig> | null = null

const getClientConfigPromise = () => {
  if (!clientConfigPromise) clientConfigPromise = initializeClientConfig()
  return clientConfigPromise
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

// Create custom fetch with mTLS
export async function createCustomFetch() {
  // In server components, we can read files
  const clientConfig = await getClientConfigPromise()

  console.log('Creating undici agent with certificates:')
  console.log('Key length:', clientConfig.mtlsKey.length)
  console.log('Cert length:', clientConfig.mtlsBundle.length)
  const agent = new undici.Agent({
    connect: {
      key: clientConfig.mtlsKey,
      cert: clientConfig.mtlsBundle,
      // Don't specify ca - use system default CA bundle for server verification
      rejectUnauthorized: true,
    },
  })

  return async (url: string, options = {}) => {
    return undici.fetch(url, {
      ...options,
      dispatcher: agent,
    }) as unknown as Response
  }
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
