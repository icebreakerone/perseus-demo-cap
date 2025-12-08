import { readFileSync } from 'fs'

import {
  createCustomFetch,
  initializeClientConfig,
  IClientConfig,
} from '../lib/clientConfig'
import { config } from './config'

const serverCaBundle = (() => {
  if (!config.serverCaPath) return undefined
  try {
    return readFileSync(config.serverCaPath, 'utf8')
  } catch (error) {
    console.warn(
      `Failed to read server CA bundle from ${config.serverCaPath}:`,
      error,
    )
    return undefined
  }
})()

const certificateOverrides = {
  mtlsKey: readFileSync(config.mtlsKeyPath, 'utf8'),
  mtlsBundle: readFileSync(config.mtlsBundlePath, 'utf8'),
  caBundle: serverCaBundle,
  skipServerVerification: config.skipServerVerification,
}

console.log(
  'CLI_SKIP_SERVER_VERIFICATION:',
  process.env.CLI_SKIP_SERVER_VERIFICATION,
)
console.log(
  'skipServerVerification config value:',
  config.skipServerVerification,
)

const clientConfigPromise = initializeClientConfig({
  server: config.publicServer,
  client_id: config.clientId,
  redirect_uri: config.redirectUri,
  post_login_route: config.postLoginRedirect,
  protectedResourceUrl: config.protectedResourceUrl,
  ...certificateOverrides,
})

const fetchFactory = clientConfigPromise.then(clientConfig =>
  createCustomFetch(clientConfig),
)

export const clientConfig: Promise<IClientConfig> = clientConfigPromise

export const customFetch: typeof fetch = async (url, options = {}) => {
  const fetchImpl = await fetchFactory
  return fetchImpl(url, options)
}
