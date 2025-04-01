import express from 'express'
import * as client from 'openid-client'
import { config } from './config'
import { customFetch } from './customFetch'
import { readFileSync } from 'fs'
const app = express()
const port = 3000

// Route to handle the OAuth2 callback and exchange code for a token
app.get('/callback', async (req, res) => {
  const authorizationCode = req.query.code as string

  if (!authorizationCode)
    return res.status(400).send('Missing authorization code.')

  // Read the code_verifier from the file
  let codeVerifier
  try {
    codeVerifier = readFileSync('code_verifier.txt', 'utf8')
  } catch (err) {
    return res.status(500).send('Failed to read code_verifier from file.')
  }

  console.log('Authorization code:', authorizationCode)
  console.log('PKCE Code Verifier:', codeVerifier)

  // Discover the issuer and client metadata
  console.log(`Discovering issuer at: ${config.server.href}`)
  const clientMetadata = { use_mtls_endpoint_aliases: true }

  const issuer = await client.discovery(
    new URL('/.well-known/oauth-authorization-server', config.server),
    config.clientId,
    clientMetadata,
    client.TlsClientAuth(),
    { [client.customFetch]: customFetch },
  )
  console.log('Discovered issuer:', issuer)

  // Get the token endpoint from the issuer's metadata
  const tokenEndpoint = issuer.serverMetadata().token_endpoint

  if (!tokenEndpoint)
    return res
      .status(500)
      .send('Token endpoint is not available in the issuer metadata.')

  console.log('Token endpoint:', tokenEndpoint)

  // Prepare the data for the token request
  const body = new URLSearchParams({
    code: authorizationCode,
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
    grant_type: 'authorization_code',
  })

  try {
    // Send the token request using customFetch (undici)
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

    // Now use the access token to fetch data from the data server
    /*
    console.log(
      'Fetching data from data server:',
      config.protectedResourceUrl.href,
    )
    */
    const dataResponse = await customFetch(config.protectedResourceUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/json',
      },
    })

    if (!dataResponse.ok) {
      const errorText = await dataResponse.text()
      console.error(
        `Error fetching data from data server: ${dataResponse.status} ${dataResponse.statusText}`,
      )
      return res
        .status(500)
        .send(`Error fetching data from data server: ${errorText}`)
    }

    const jsonData = await dataResponse.json()
    console.log('Data from data server:', jsonData)

    // Send the JSON response back to the client
    res.json(jsonData)
  } catch (error) {
    console.error('Error during token exchange:', error)
    res.status(500).send('Error during token exchange')
  }
})

// Start the server
app.listen(port, () => {
  console.info(`Server is running on https://localhost:${port}`)
})
