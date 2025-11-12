import express from 'express'
import * as client from 'openid-client'
import { readFileSync } from 'fs'

import { clientConfig as clientConfigPromise, customFetch } from './customFetch'

const app = express()
const port = 3000

app.get('/callback', async (req, res) => {
  const authorizationCode = req.query.code as string

  if (!authorizationCode)
    return res.status(400).send('Missing authorization code.')

  let codeVerifier
  try {
    codeVerifier = readFileSync('code_verifier.txt', 'utf8')
  } catch (err) {
    return res.status(500).send('Failed to read code_verifier from file.')
  }

  console.log('Authorization code:', authorizationCode)
  console.log('PKCE Code Verifier:', codeVerifier)

  const resolvedClientConfig = await clientConfigPromise

  console.log(`Discovering issuer at: ${resolvedClientConfig.server.href}`)
  const originalFetch = globalThis.fetch
  let issuer: client.Configuration
  try {
    globalThis.fetch = customFetch as typeof fetch
    issuer = await client.discovery(
      new URL(
        '/.well-known/oauth-authorization-server',
        resolvedClientConfig.server,
      ),
      resolvedClientConfig.client_id,
      { use_mtls_endpoint_aliases: true },
      client.TlsClientAuth(),
      { [client.customFetch]: customFetch },
    )
  } finally {
    globalThis.fetch = originalFetch
  }
  console.log('Discovered issuer:', issuer)

  const tokenEndpoint = issuer.serverMetadata().token_endpoint

  if (!tokenEndpoint)
    return res
      .status(500)
      .send('Token endpoint is not available in the issuer metadata.')

  console.log('Token endpoint:', tokenEndpoint)

  const body = new URLSearchParams({
    code: authorizationCode,
    client_id: resolvedClientConfig.client_id,
    redirect_uri: resolvedClientConfig.redirect_uri,
    code_verifier: codeVerifier,
    grant_type: resolvedClientConfig.grant_type,
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
        `Error in token request: ${tokenResponse.status} ${tokenResponse.statusText}`,
      )
      return res.status(500).send(`Error in token request: ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    console.log('Access Token:', tokenData.access_token)

    console.log(
      'Fetching data from data server:',
      resolvedClientConfig.protectedResourceUrl.href,
    )
    const dataResponse = await customFetch(
      resolvedClientConfig.protectedResourceUrl,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/json',
        },
      },
    )

    if (!dataResponse.ok) {
      const errorText = await dataResponse.text()
      console.error(
        `Error fetching data from data server: ${dataResponse.status} ${dataResponse.statusText}`,
      )
      console.error(
        'Response headers:',
        Object.fromEntries(dataResponse.headers),
      )
      console.error('Response body:', errorText)
      return res
        .status(500)
        .send(`Error fetching data from data server: ${errorText}`)
    }

    const jsonData = await dataResponse.json()

    console.log(
      'Testing permissions with refresh token:',
      tokenData.refresh_token,
    )
    const permissionsBody = new URLSearchParams({
      token: tokenData.refresh_token,
    })

    const permissionsResponse = await customFetch(
      new URL('/api/v1/permissions', resolvedClientConfig.server),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: permissionsBody.toString(),
      },
    )

    if (!permissionsResponse.ok) {
      const errorText = await permissionsResponse.text()
      console.error(
        `Error testing permissions: ${permissionsResponse.status} ${permissionsResponse.statusText}`,
      )
      return res.status(500).send(`Error testing permissions: ${errorText}`)
    }

    const permissionsData = await permissionsResponse.json()
    console.log('Permissions data:', permissionsData)
    res.json(jsonData)
  } catch (error) {
    console.error('Error during token exchange:', error)
    res.status(500).send('Error during token exchange')
  }
})

app.listen(port, () => {
  console.info(`Server is running on http://localhost:${port}`)
})
