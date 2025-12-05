import * as undici from 'undici'
import { readFileSync } from 'fs'
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager'

export interface ICertificates {
  mtlsKey: string
  mtlsBundle: string
  caBundle?: string
}

export interface IClientConfig extends ICertificates {
  server: URL
  client_id: string
  redirect_uri: string
  scope: string
  response_type: string
  grant_type: string
  post_login_route: string
  code_challenge_method: string
  protectedResourceUrl: URL
  skipServerVerification?: boolean
}

export const resolveAppEnv = () => {
  const value = process.env.APP_ENV ?? process.env.ENVIRONMENT

  if (!value) {
    console.warn(
      'APP_ENV environment variable is missing; defaulting to "local"',
    )
    return 'local'
  }

  console.log('Resolved APP_ENV:', value)
  return value
}

export const isLocalEnv = () => resolveAppEnv() === 'local'

const loadCertificatesFromLocal = (
  overrides?: Partial<ICertificates>,
): ICertificates => {
  if (overrides?.mtlsKey && overrides?.mtlsBundle)
    return {
      mtlsKey: overrides.mtlsKey,
      mtlsBundle: overrides.mtlsBundle,
      caBundle: overrides.caBundle,
    }

  const mtlsKeyPath =
    process.env.MTLS_KEY_PATH ?? './certs/cap-demo-certs/cap-demo-key.pem'
  const mtlsBundlePath =
    process.env.MTLS_BUNDLE_PATH ?? './certs/cap-demo-certs/cap-demo-bundle.pem'

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

const loadCertificatesFromSecretsManager = async (
  overrides?: Partial<ICertificates>,
): Promise<ICertificates> => {
  if (overrides?.mtlsKey && overrides?.mtlsBundle)
    return {
      mtlsKey: overrides.mtlsKey,
      mtlsBundle: overrides.mtlsBundle,
      caBundle: overrides.caBundle,
    }

  const secretsManager = new SecretsManagerClient({ region: 'eu-west-2' })
  const secretName = `${resolveAppEnv()}/perseus-demo-cap/mtls-key-bundle`
  console.log('Loading certificates from AWS Secrets Manager:', secretName)
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName })
    const data = await secretsManager.send(command)
    const secret = data.SecretString ? JSON.parse(data.SecretString) : null
    if (!secret)
      throw new Error('Secret is empty or not in the expected format.')

    const mtlsBundle: string = secret.mtlsBundle || secret.mtlsBundle
    if (!mtlsBundle)
      throw new Error('Secret missing mtlsBundle (or mtlsBundle)')

    return {
      mtlsKey: secret.mtlsKey,
      mtlsBundle,
      caBundle: overrides?.caBundle,
    }
  } catch (error) {
    console.error('Error retrieving certificates from Secrets Manager:', error)
    throw error
  }
}

export const initializeClientConfig = async (
  overrides?: Partial<IClientConfig>,
): Promise<IClientConfig> => {
  let certificates: ICertificates

  if (isLocalEnv())
    try {
      console.log('Attempting to load certificates from local filesystem')
      certificates = loadCertificatesFromLocal(overrides)
      console.log('Successfully loaded certificates from local files')
    } catch (error) {
      console.error('Failed to load certificates from local files:', error)
      console.log('Falling back to AWS Secrets Manager...')
      certificates = await loadCertificatesFromSecretsManager(overrides)
    }
  else {
    console.log('Non-local environment detected; loading certificates from AWS')
    certificates = await loadCertificatesFromSecretsManager(overrides)
  }

  const baseConfig: IClientConfig = {
    server: new URL(
      process.env.NEXT_PUBLIC_SERVER_URL ||
        'https://preprod.perseus-demo-authentication.ib1.org',
    ),
    client_id: process.env.NEXT_PUBLIC_CLIENT_ID as string,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    mtlsKey: certificates.mtlsKey,
    mtlsBundle: certificates.mtlsBundle,
    caBundle: certificates.caBundle,
    scope:
      'https://registry.core.sandbox.trust.ib1.org/scheme/perseus/license/energy-consumption-data/2024-12-05+offline_access',
    response_type: 'code',
    grant_type: 'authorization_code',
    post_login_route: process.env.NEXT_PUBLIC_REDIRECT_URL as string,
    code_challenge_method: 'S256',
    protectedResourceUrl: new URL(
      process.env.NEXT_PUBLIC_PROTECTED_RESOURCE_URL ||
        'https://preprod.perseus-demo-energy.ib1.org/datasources/id/measure?from=2024-12-05T00:00:00Z&to=2024-12-06T00:00:00Z',
    ),
    skipServerVerification: false,
  }

  return {
    ...baseConfig,
    ...overrides,
    mtlsKey: overrides?.mtlsKey ?? baseConfig.mtlsKey,
    mtlsBundle: overrides?.mtlsBundle ?? baseConfig.mtlsBundle,
    caBundle: overrides?.caBundle ?? baseConfig.caBundle,
    skipServerVerification:
      overrides?.skipServerVerification ?? baseConfig.skipServerVerification,
  }
}

let clientConfigPromise: Promise<IClientConfig> | null = null

export const getClientConfigPromise = () => {
  if (!clientConfigPromise) clientConfigPromise = initializeClientConfig()
  return clientConfigPromise
}

export const createCustomFetch = async (config?: IClientConfig) => {
  const clientConfig = config ?? (await getClientConfigPromise())

  console.log('Creating undici agent with certificates:')
  console.log('Key length:', clientConfig.mtlsKey.length)
  console.log('Cert length:', clientConfig.mtlsBundle.length)
  console.log(
    'skipServerVerification:',
    clientConfig.skipServerVerification ?? false,
  )

  const rejectUnauthorized = !(clientConfig.skipServerVerification ?? false)
  console.log('Setting rejectUnauthorized to:', rejectUnauthorized)

  const agent = new undici.Agent({
    connect: {
      key: clientConfig.mtlsKey,
      cert: clientConfig.mtlsBundle,
      ca: clientConfig.caBundle,
      rejectUnauthorized,
    },
  })

  return async (
    url: string | URL,
    options: Parameters<typeof undici.fetch>[1] = {},
  ) => {
    return undici.fetch(url, {
      ...options,
      dispatcher: agent,
    }) as unknown as Response
  }
}
