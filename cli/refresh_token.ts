import * as client from 'openid-client'
import { clientConfig as clientConfigPromise, customFetch } from './customFetch'

const refreshToken = process.argv[2]

if (!refreshToken) {
  console.error('Usage: npm run refresh_token <refresh_token>')
  console.error('   or: npx tsx refresh_token.ts <refresh_token>')
  process.exit(1)
}

const resolvedClientConfig = await clientConfigPromise

console.log('--------------------------------')
console.log('🔄 Refreshing access token')

const discoveryUrl = new URL(
  '/.well-known/oauth-authorization-server',
  resolvedClientConfig.server,
)
console.log(`Loading ${discoveryUrl.href}`)

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

console.log('✅ Discovery successful')

const tokenEndpoint = issuer.serverMetadata().token_endpoint

if (!tokenEndpoint) {
  console.error('Token endpoint is not available in the issuer metadata.')
  process.exit(1)
}

console.log(`Token endpoint: ${tokenEndpoint}`)

const body = new URLSearchParams({
  grant_type: 'refresh_token',
  refresh_token: refreshToken,
  client_id: resolvedClientConfig.client_id,
})

try {
  const tokenResponse = await customFetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text()
    console.error(
      `Error in token refresh request: ${tokenResponse.status} ${tokenResponse.statusText}`,
    )
    console.error(errorText)
    process.exit(1)
  }

  const tokenData = await tokenResponse.json()
  console.log('✅ Access token refreshed successfully')
  console.log('--------------------------------')
  console.log('Token Response:')
  console.log(JSON.stringify(tokenData, null, 2))
  console.log('--------------------------------')

  if (tokenData.access_token) {
    console.log('✅ New access token received')
    console.log(`Access token: ${tokenData.access_token.substring(0, 50)}...`)
  }

  if (tokenData.refresh_token) {
    console.log('✅ New refresh token received')
    console.log(`Refresh token: ${tokenData.refresh_token.substring(0, 50)}...`)
  }

  // Test the new access token by making a request to the protected resource
  console.log('--------------------------------')
  console.log('🔍 Testing new access token with protected resource')
  const meterDataResponse = await customFetch(
    new URL('/datasources/', resolvedClientConfig.protectedResourceUrl),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/json',
      },
    },
  )

  if (!meterDataResponse.ok) {
    const errorText = await meterDataResponse.text()
    console.error(
      `Error fetching data from protected resource: ${meterDataResponse.status} ${meterDataResponse.statusText}`,
    )
    console.error(errorText)
    process.exit(1)
  }

  const meterData = await meterDataResponse.json()
  console.log('✅ Protected resource accessed successfully')
  console.log('--------------------------------')
  console.log('✅ Refresh token flow completed successfully')
} catch (error) {
  console.error('Error during token refresh:', error)
  process.exit(1)
}
