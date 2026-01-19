import { writeFileSync } from 'fs'
import * as client from 'openid-client'
import { clientConfig as clientConfigPromise, customFetch } from './customFetch'

const resolvedClientConfig = await clientConfigPromise

const discoveryUrl = new URL(
  '/.well-known/oauth-authorization-server',
  resolvedClientConfig.server,
)

const originalFetch = globalThis.fetch
let issuer: client.Configuration
try {
  globalThis.fetch = customFetch as typeof fetch
  issuer = await client.discovery(
    discoveryUrl,
    resolvedClientConfig.client_id,
    { use_mtls_endpoint_aliases: true },
    client.TlsClientAuth(),
    { [client.customFetch]: customFetch },
  )
} finally {
  globalThis.fetch = originalFetch
}
console.log('--------------------------------')
console.log(`Loading ${discoveryUrl.href}`)
console.log(`✅ Discovery successful`)

const code_verifier = client.randomPKCECodeVerifier()
const code_challenge = await client.calculatePKCECodeChallenge(code_verifier)

// In production this would be persisted securely. For the CLI we store it locally for the callback step.
writeFileSync('code_verifier.txt', code_verifier)
console.log(`✅ Code verifier written to code_verifier.txt`)
const parameters: Record<string, string> = {
  client_id: resolvedClientConfig.client_id,
  redirect_uri: resolvedClientConfig.redirect_uri,
  response_type: resolvedClientConfig.response_type,
  scope: resolvedClientConfig.scope,
  code_challenge,
  code_challenge_method: resolvedClientConfig.code_challenge_method,
}

const parEndpoint =
  issuer.serverMetadata().pushed_authorization_request_endpoint
if (!parEndpoint) throw new Error('Authorization endpoint is undefined')
console.log(`Sending PAR request to ${parEndpoint}`)
const parResponse = await customFetch(parEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams(parameters).toString(),
})

if (!parResponse.ok) {
  console.error(
    `Error in PAR request: ${parResponse.status} ${parResponse.statusText}`,
  )
  console.error(await parResponse.text())
  process.exit(1)
}

const parData = await parResponse.json()
console.log('✅ PAR Response received with request_uri:', parData.request_uri)

const authorizationEndpoint = issuer.serverMetadata().authorization_endpoint
if (!authorizationEndpoint)
  throw new Error('Authorization endpoint is undefined')

const authorizationUrl = new URL(authorizationEndpoint)
authorizationUrl.searchParams.set('client_id', resolvedClientConfig.client_id)
authorizationUrl.searchParams.set('request_uri', parData.request_uri)
console.log('--------------------------------')
console.log('🔗 Open this URL to authorize:')
console.log(authorizationUrl.href)
