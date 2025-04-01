import * as client from 'openid-client'
import { config } from './config'
import { customFetch } from './customFetch'
import { writeFileSync } from 'fs'

// First, test direct fetch to ensure mTLS works
console.log(
  `Fetching metadata from: ${config.server.href}.well-known/oauth-authorization-server`,
)
const res = await customFetch(
  new URL('/.well-known/oauth-authorization-server', config.server).toString(),
)

if (!res.ok) {
  console.error(
    `Error fetching discovery document: ${res.status} ${res.statusText}`,
  )
  console.error(await res.text())
}
const json = await res.json()
console.log('Raw discovery document:', json)

// Now, pass the custom fetch function to discovery
console.log(`Discovering issuer at: ${config.server.href}`)
// Couldn't use .discovery() without providing the path due to URL.href adding a trailing slash
// meaning issuer doesn't match the expected issuer from the discovery document
const clientMetadata = { use_mtls_endpoint_aliases: true }

const issuer = await client.discovery(
  new URL('/.well-known/oauth-authorization-server', config.server),
  config.clientId,
  clientMetadata,
  client.TlsClientAuth(),
  { [client.customFetch]: customFetch },
)
console.log('Discovered issuer:', issuer)

console.log(issuer.serverMetadata())

const code_verifier = client.randomPKCECodeVerifier()
const code_challenge = await client.calculatePKCECodeChallenge(code_verifier)
writeFileSync('code_verifier.txt', code_verifier) // In production this might be a session
// Construct the parameters for PAR
const parameters: Record<string, string> = {
  client_id: config.clientId,
  redirect_uri: config.redirectUri,
  response_type: 'code',
  scope:
    'https://registry.core.pilot.trust.ib1.org/scheme/perseus/license/energy-consumption-data/2024-12-05+offline_access',
  code_challenge,
  code_challenge_method: 'S256',
}

// Use PAR to get request_uri
const parEndpoint =
  issuer.serverMetadata().pushed_authorization_request_endpoint
if (!parEndpoint) throw new Error('Authorization endpoint is undefined')

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
console.log('PAR Response:', parData)

// Redirect user to authorization endpoint with request_uri
const authorizationEndpoint = issuer.serverMetadata().authorization_endpoint
if (!authorizationEndpoint)
  throw new Error('Authorization endpoint is undefined')

const authorizationUrl = new URL(authorizationEndpoint)
authorizationUrl.searchParams.set('client_id', config.clientId)
authorizationUrl.searchParams.set('request_uri', parData.request_uri)
console.log('Code verifier:', code_verifier)
console.log('Redirect user to:', authorizationUrl.href)
// Now redirect the user to authorizationUrl.href
