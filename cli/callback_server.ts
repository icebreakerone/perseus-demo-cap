import express from 'express'
import * as client from 'openid-client'
import { readFileSync } from 'fs'

import { clientConfig as clientConfigPromise, customFetch } from './customFetch'
import { config } from './config'

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

  console.log('--------------------------------')
  console.log('✅ Authorization code received')

  const resolvedClientConfig = await clientConfigPromise

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
  console.log('✅ Discovery successful')

  const tokenEndpoint = issuer.serverMetadata().token_endpoint

  if (!tokenEndpoint)
    return res
      .status(500)
      .send('Token endpoint is not available in the issuer metadata.')

  console.log('🔄 Exchanging authorization code for access token')
  console.log(`Token endpoint: ${tokenEndpoint}`)
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
    console.log('✅ Access token received')

    console.log(
      `Meter catalog URL: ${resolvedClientConfig.protectedResourceUrl}/datasources/`,
    )
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
        `Error fetching data from data server: ${meterDataResponse.status} ${meterDataResponse.statusText}`,
      )
      return res
        .status(500)
        .send(`Error fetching data from data server: ${errorText}`)
    }
    const meterData = await meterDataResponse.json()
    console.log('✅ Meter catalog received')

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

    const meterId = firstMeter.id
    const meterMeasure = firstMeter.availableMeasures[0]
    console.log(`📈 Fetching data for meter ${meterId} (${meterMeasure})`)
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
      return res
        .status(500)
        .send(`Error fetching data from data server: ${errorText}`)
    }
    const data = await dataResponse.json()
    console.log('✅ Meter data received')
    // Only run provenance-related code if ENABLE_PROVENANCE flag is set
    if (process.env.ENABLE_PROVENANCE === 'true') {
      console.log('🔐 Processing provenance data')
      const decodedProvenance = await fetch(
        new URL('/api/v1/decode', config.provenanceServiceUrl),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data['provenance']),
        },
      )
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
      console.log('✍️  Signing CAP record with provenance service')
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
      if (!capRecordEncoded.ok) {
        const errorText = await capRecordEncoded.text()
        console.error(
          `Error signing cap record: ${capRecordEncoded.status} ${capRecordEncoded.statusText}`,
        )
        return res.status(500).send(`Error signing cap record: ${errorText}`)
      }
      console.log('✅ CAP record signed')
    }
    console.log('🔍 Testing permissions with refresh token')
    const permissionsBody = new URLSearchParams({
      token: tokenData.refresh_token,
    })
    // Permissions endpoint requires mTLS - convert server URL to mTLS endpoint
    // If server is already mTLS, use it; otherwise convert to mTLS subdomain
    let permissionsServerUrl: URL
    if (resolvedClientConfig.server.hostname.includes('mtls.')) {
      permissionsServerUrl = resolvedClientConfig.server
    } else {
      // Convert to mTLS endpoint: https://example.com -> https://mtls.example.com
      permissionsServerUrl = new URL(resolvedClientConfig.server)
      permissionsServerUrl.hostname = `mtls.${permissionsServerUrl.hostname}`
    }

    console.log('Requesting permissions from:', permissionsServerUrl.href)
    const permissionsResponse = await customFetch(
      new URL('/api/v1/permissions', permissionsServerUrl),
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
    console.log('✅ Permissions verified')
    console.log('--------------------------------')
    console.log('✅ All steps completed successfully')
    res.json(data)
  } catch (error) {
    console.error('Error during token exchange:', error)
    res.status(500).send('Error during token exchange')
  }
})

app.listen(port, () => {
  console.log('--------------------------------')
  console.log(`🚀 Callback server running on http://localhost:${port}`)
  console.log('Waiting for authorization callback...')
})
