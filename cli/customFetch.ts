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

// --insecure only covers loopback hosts, so warn rather than fail silently when
// it is passed for a deployment that is not local.
if (config.insecureLocalhost && config.insecureHosts) {
  const targets = [
    config.publicServer,
    config.mTLSAuthorisationServer,
    config.protectedResourceUrl,
  ]
  if (!targets.some(url => config.insecureHosts!.includes(url.hostname)))
    console.warn(
      '⚠️  --insecure was given but no configured server is on localhost; certificates will still be verified.',
    )
}

console.log('MTLS key path:', config.mtlsKeyPath)
console.log('MTLS bundle path:', config.mtlsBundlePath)
console.log('Server CA bundle path:', config.serverCaPath)
console.log('Skip server verification:', config.skipServerVerification)
const certificateOverrides = {
  mtlsKey: readFileSync(config.mtlsKeyPath, 'utf8'),
  mtlsBundle: readFileSync(config.mtlsBundlePath, 'utf8'),
  caBundle: serverCaBundle,
  skipServerVerification: config.skipServerVerification,
  insecureHosts: config.insecureHosts,
}

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
