import { writeFileSync } from 'fs'
import * as client from 'openid-client'
// Relative, not '@lib/...': the CLI does not use the root path aliases
import { discover, mtlsEndpoint } from '../lib/discovery'
import { clientConfig as clientConfigPromise, customFetch } from './customFetch'

const resolvedClientConfig = await clientConfigPromise

console.log('--------------------------------')
console.log(`Discovering ${resolvedClientConfig.server.href}`)
const issuer = await discover(
  resolvedClientConfig.server,
  resolvedClientConfig.client_id,
  customFetch,
)
console.log(`✅ Discovery successful`)

const code_verifier = client.randomPKCECodeVerifier()
const code_challenge = await client.calculatePKCECodeChallenge(code_verifier)
const state = client.randomState()

// In production these would be persisted securely. For the CLI they are stored
// locally for the callback step.
writeFileSync('code_verifier.txt', code_verifier)
writeFileSync('state.txt', state)
console.log(
  `✅ Code verifier and state written to code_verifier.txt and state.txt`,
)
const parameters: Record<string, string> = {
  client_id: resolvedClientConfig.client_id,
  redirect_uri: resolvedClientConfig.redirect_uri,
  response_type: resolvedClientConfig.response_type,
  scope: resolvedClientConfig.scope,
  code_challenge,
  code_challenge_method: resolvedClientConfig.code_challenge_method,
  state,
}

const parEndpoint = mtlsEndpoint(
  issuer,
  'pushed_authorization_request_endpoint',
)
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
