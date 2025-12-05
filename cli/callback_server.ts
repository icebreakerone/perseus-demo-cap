import express from 'express'
import * as client from 'openid-client'
import { readFileSync } from 'fs'

import { clientConfig as clientConfigPromise, customFetch } from './customFetch'
import { config } from './config'

const app = express()
const port = 3000

app.get('/callback', async (req, res) => {
  const authorizationCode = req.query.code as string
  console.error('Query parameters:', req.query)
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
      'Fetching meter data from data server:',
      resolvedClientConfig.protectedResourceUrl.href,
    )
    const meterDataResponse = await customFetch(
      resolvedClientConfig.protectedResourceUrl,
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
        `Error fetching data from data server: ${meterDataResponse.status} ${meterDataResponse.statusText}`,
      )
      console.error('Response body:', errorText)
      return res
        .status(500)
        .send(`Error fetching data from data server: ${errorText}`)
    }
    const meterData = await meterDataResponse.json()
    console.log('Meter data:', meterData)

    // meterData.data is an array, so we need to access the first element
    if (
      !meterData.data ||
      !Array.isArray(meterData.data) ||
      meterData.data.length === 0
    ) {
      return res.status(500).send('No meter data available')
    }

    const firstMeter = meterData.data[0]
    if (
      !firstMeter.availableMeasures ||
      !Array.isArray(firstMeter.availableMeasures) ||
      firstMeter.availableMeasures.length === 0
    ) {
      return res.status(500).send('No available measures for meter')
    }

    console.log('Available measures:', firstMeter.availableMeasures)
    const meterId = firstMeter.id
    const meterMeasure = firstMeter.availableMeasures[0]
    console.log('Request data for meter:', meterId, meterMeasure)
    const dataResponse = await customFetch(
      new URL(
        `/datasources/${meterId}/${meterMeasure}?from=2024-12-05&to=2024-12-06`,
        resolvedClientConfig.protectedResourceUrl,
      ),
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
      console.error('Response body:', errorText)
      return res
        .status(500)
        .send(`Error fetching data from data server: ${errorText}`)
    }
    const data = await dataResponse.json()
    // Only run provenance-related code if ENABLE_PROVENANCE flag is set
    if (process.env.ENABLE_PROVENANCE === 'true') {
      const decodedProvenance = await fetch(
        new URL('/api/v1/decode', config.provenanceServiceUrl),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data['provenance']),
        },
      )
      console.log('Decoded provenance:', decodedProvenance.json())
      // Test provenance service endpoint
      const capRecordRequest = {
        edp_data_attachment: data['provenance'],
        // Must match the 'to' field in the EDP transfer step
        cap_member_id: 'https://member.core.sandbox.trust.ib1.org/a/s2914npr',
        // Placeholder – not currently used in provenance-service matching logic
        bank_member_id: 'bank-member-456',
        cap_account: 'cap-account-789',
        cap_permission_granted: new Date().toISOString(),
        cap_permission_expires: new Date(
          Date.now() + 1000 * 60 * 60 * 24 * 30,
        ).toISOString(),
        grid_intensity_origin: 'https://example.com/grid-intensity-origin',
        grid_intensity_license: 'https://example.com/grid-intensity-license',
        postcode: 'AB12CD',
        // Must match the 'service' field in the EDP transfer step
        edp_service_url:
          'https://preprod.perseus-demo-energy.ib1.org/datasources/id/measure',
        // Must match the member URL from the EDP signing certificate
        edp_member_id: 'https://member.core.sandbox.trust.ib1.org/m/7a1qv915',
        // Placeholder – not currently used in provenance-service matching logic
        bank_service_url: 'https://example.com/bank-service-url',
        // Must match the metering period in the EDP transfer step
        from_date: '2024-12-05',
        to_date: '2024-12-06',
      }
      console.log(
        'Signing cap record with provenance service:',
        data['provenance'],
      )
      const capRecordEncoded = await fetch(
        new URL('/api/v1/sign/cap', config.provenanceServiceUrl),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(capRecordRequest),
        },
      )
      console.log('Cap record encoded:', capRecordEncoded)
      if (!capRecordEncoded.ok) {
        const errorText = await capRecordEncoded.text()
        console.error(
          `Error signing cap record: ${capRecordEncoded.status} ${capRecordEncoded.statusText}`,
        )
        return res.status(500).send(`Error signing cap record: ${errorText}`)
      }
    }
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
    res.json(data)
  } catch (error) {
    console.error('Error during token exchange:', error)
    res.status(500).send('Error during token exchange')
  }
})

app.listen(port, () => {
  console.info(`Server is running on http://localhost:${port}`)
})
