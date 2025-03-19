import { getIronSession, IronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import * as client from 'openid-client'
import * as undici from 'undici'
import { readFileSync } from 'fs'
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager'

interface ICertificates {
  mtlsKey: string
  mtlsBundle: string
  serverCa: string
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

const env = process.env.APP_ENV || 'dev'
const isDevelopment = env === 'dev'

// Define a function to load certificates in development (local files)
const loadCertificatesFromLocal = (): ICertificates => {
  const mtlsKeyPath = './certs/local-development-key.pem'
  const mtlsBundlePath = './certs/local-development-bundle.pem'
  const serverCaPath = './certs/directory-server-certificates/bundle.pem'

  return {
    mtlsKey: readFileSync(mtlsKeyPath, 'utf8'),
    mtlsBundle: readFileSync(mtlsBundlePath, 'utf8'),
    serverCa: readFileSync(serverCaPath, 'utf8'),
  }
}

// Define a function to load certificates from AWS Secrets Manager in production
const loadCertificatesFromSecretsManager = async (): Promise<ICertificates> => {
  const secretsManager = new SecretsManagerClient({ region: 'eu-west-2' })
  const secretName = `${process.env.APP_ENV}/perseus-demo-cap/mtls-key-bundle`

  try {
    const command = new GetSecretValueCommand({ SecretId: secretName })
    const data = await secretsManager.send(command)
    const secret = data.SecretString ? JSON.parse(data.SecretString) : null
    if (!secret)
      throw new Error('Secret is empty or not in the expected format.')

    return {
      mtlsKey: secret.mtlsKey,
      mtlsBundle: secret.mtlsBundle,
      serverCa: secret.serverCa,
    }
  } catch (error) {
    console.error('Error retrieving certificates from Secrets Manager:', error)
    throw error
  }
}

// Function to initialize clientConfig asynchronously
export const initializeClientConfig = async (): Promise<IClientConfig> => {
  const certificates = isDevelopment
    ? loadCertificatesFromLocal()
    : await loadCertificatesFromSecretsManager()

  return {
    server: new URL(process.env.NEXT_PUBLIC_SERVER as string),
    client_id: process.env.NEXT_PUBLIC_CLIENT_ID as string,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    mtlsKey: certificates.mtlsKey,
    mtlsBundle: certificates.mtlsBundle,
    serverCa: certificates.serverCa,
    scope:
      'https://registry.core.pilot.trust.ib1.org/scheme/perseus/license/energy-consumption-data/2024-12-05+offline_access',
    response_type: 'code',
    grant_type: 'authorization_code',
    post_login_route: process.env.NEXT_PUBLIC_APP_URL as string,
    code_challenge_method: 'S256',
    protectedResourceUrl: new URL(
      'https://preprod.perseus-demo-energy.ib1.org/datasources/id/measure?from=2024-12-05T00:00:00Z&to=2024-12-06T00:00:00Z',
    ),
  }
}

// Initialize clientConfig
const clientConfigPromise = initializeClientConfig()

// Session and fetch setup remain unchanged

export interface SessionData {
  isLoggedIn: boolean
  access_token?: string
  code_verifier?: string
  state?: string
  tenantId?: string
}

const password = process.env.SECRET_COOKIE_PASSWORD as string
if (!password)
  throw new Error('SECRET_COOKIE_PASSWORD environment variable is missing')

export const sessionOptions: SessionOptions = {
  password: password,
  cookieName: 'iron-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
}

export async function getSession() {
  const cookieStore = await cookies()
  console.log('cookieStore', cookieStore)
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) session.isLoggedIn = defaultSession.isLoggedIn

  return session
}

// Create custom fetch with mTLS
export async function createCustomFetch() {
  // In server components, we can read files
  const clientConfig = await clientConfigPromise
  const agent = new undici.Agent({
    connect: {
      key: clientConfig.mtlsKey,
      cert: clientConfig.mtlsBundle,
      ca: clientConfig.serverCa,
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
  const clientConfig = await clientConfigPromise
  console.log(clientConfig)
  const customFetch = await createCustomFetch()
  const res = await customFetch(
    new URL(
      '/.well-known/oauth-authorization-server',
      clientConfig.server,
    ).toString(),
  )

  if (!res.ok) {
    console.error(
      `Error fetching discovery document: ${res.status} ${res.statusText}`,
    )
    console.error(await res.text())
  }
  const json = await res.json()
  console.log('Raw discovery document:', json)
  // Use discovery with mTLS
  const issuer = await client.discovery(
    new URL('/.well-known/oauth-authorization-server', clientConfig.server),
    clientConfig.client_id,
    { use_mtls_endpoint_aliases: true },
    client.TlsClientAuth(),
    { [client.customFetch]: customFetch },
  )

  return issuer
}

export async function generateAuthUrl(session: IronSession<SessionData>) {
  const issuer = await getClientConfig()
  const clientConfig = await clientConfigPromise
  // Generate PKCE code verifier and challenge
  const code_verifier = client.randomPKCECodeVerifier()
  const code_challenge = await client.calculatePKCECodeChallenge(code_verifier)

  // Store code_verifier in session for later token exchange
  session.code_verifier = code_verifier

  // Prepare PAR request
  const customFetch = await createCustomFetch()
  const parEndpoint =
    issuer.serverMetadata().pushed_authorization_request_endpoint
  console.log('parEndpoint', parEndpoint)
  if (!parEndpoint) throw new Error('PAR endpoint not found in server metadata')

  const parameters = {
    client_id: clientConfig.client_id,
    redirect_uri: clientConfig.redirect_uri,
    response_type: 'code',
    scope: clientConfig.scope,
    code_challenge,
    code_challenge_method: 'S256',
  }
  console.log('parameters', parameters)
  // Make PAR request
  const parResponse = await customFetch(parEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(parameters).toString(),
  })

  if (!parResponse.ok)
    throw new Error(
      `PAR request failed: ${parResponse.status} ${parResponse.statusText}`,
    )

  const parData = await parResponse.json()

  // Generate authorization URL with request_uri
  const authEndpoint = issuer.serverMetadata().authorization_endpoint
  if (!authEndpoint) throw new Error('Authorization endpoint not found')

  const authUrl = new URL(authEndpoint)
  authUrl.searchParams.set('client_id', clientConfig.client_id)
  authUrl.searchParams.set('request_uri', parData.request_uri)

  await session.save()

  return authUrl.href
}
