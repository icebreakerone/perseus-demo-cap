import {
  createCustomFetch,
  getClientConfig,
  getSession,
  // initializeClientConfig,
} from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

type TokenResponse = {
  access_token?: string
}

const config = {
  publicServer: new URL(
    process.env.CLI_PUBLIC_SERVER ??
      'https://mtls.perseus-demo-authentication.ib1.org', //'https://localhost:8000'
  ),
  mTLSAuthorisationServer: new URL(
    process.env.CLI_MTLS_AUTHORISATION_SERVER ??
      'https://mtls.perseus-demo-authentication.ib1.org',
  ),
  clientId:
    process.env.CLI_CLIENT_ID ??
    'https://directory.core.sandbox.trust.ib1.org/a/s2914npr',
  redirectUri: process.env.CLI_REDIRECT_URI ?? 'http://localhost:3000/callback',
  postLoginRedirect:
    process.env.CLI_POST_LOGIN_REDIRECT ?? 'http://localhost:3000/callback',
  mtlsBundlePath:
    process.env.CLI_MTLS_BUNDLE_PATH ??
    '../certs/cap-demo-certs/cap-demo-bundle.pem',
  mtlsKeyPath:
    process.env.CLI_MTLS_KEY_PATH ?? '../certs/cap-demo-certs/cap-demo-key.pem',
  serverCaPath: process.env.CLI_SERVER_CA_PATH,
  skipServerVerification: ['true', '1', 'yes'].includes(
    process.env.CLI_SKIP_SERVER_VERIFICATION?.toLowerCase() ?? '',
  ),
  protectedResourceUrl: new URL(
    process.env.CLI_PROTECTED_RESOURCE_URL ??
      'https://preprod.mtls.perseus-demo-energy.ib1.org/datasources/', //'https://localhost:8010/datasources/'
  ),
  provenanceServiceUrl: new URL(
    process.env.CLI_PROVENANCE_SERVICE_URL ?? 'http://localhost:8081',
  ),
  mtlsAuthorisationServer: new URL(
    process.env.CLI_MTLS_AUTHORISATION_SERVER ??
      'https://mtls.perseus-demo-authentication.ib1.org',
  ),
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSession()
  const issuer = await getClientConfig()
  const customFetch = await createCustomFetch()
  // const clientConfig = await initializeClientConfig()

  let accessToken = session.access_token

  if (!accessToken) {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')

    if (!code)
      return NextResponse.json(
        { error: 'Missing access token or authorization code.' },
        { status: 401 },
      )

    const tokenEndpoint = issuer.serverMetadata().token_endpoint

    if (!tokenEndpoint)
      return NextResponse.json(
        { error: 'Token endpoint is not available in the issuer metadata.' },
        { status: 500 },
      )

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      // redirect_uri: clientConfig.redirect_uri,
      // client_id: clientConfig.client_id,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      code_verifier: session.code_verifier || '',
    }).toString()

    const tokenResponse = await customFetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      return NextResponse.json(
        {
          error: 'Token request failed',
          details: errorText,
        },
        { status: 500 },
      )
    }
    console.log(
      'API > getData # Token response status ok:',
      tokenResponse.status,
      tokenResponse.statusText,
    )

    const tokenData = (await tokenResponse.json()) as TokenResponse
    console.log('API > getData # Token response data:', tokenData)

    if (!tokenData.access_token)
      return NextResponse.json(
        { error: 'Access token missing from token response.' },
        { status: 500 },
      )

    session.access_token = tokenData.access_token
    session.isLoggedIn = true
    await session.save()

    accessToken = tokenData.access_token
  }

  console.log('API > getData # Using access token:', accessToken)

  const meterDataResponse = await customFetch(
    // new URL('/datasources/', clientConfig.protectedResourceUrl),
    new URL('/datasources/', config.protectedResourceUrl),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    },
  )
  console.log(
    `API > getData # Meter data response status: ${meterDataResponse.status} ${meterDataResponse.statusText}`,
  )

  if (!meterDataResponse.ok) {
    const errorText = await meterDataResponse.text()
    return NextResponse.json(
      {
        error: 'Error fetching data from data server',
        details: errorText,
      },
      { status: 500 },
    )
  }
  console.log('API > getData # Meter data response received successfully')

  const meterData = await meterDataResponse.json()
  console.log('API > getData # Meter data:', meterData)

  if (!meterData?.data || !Array.isArray(meterData.data))
    return NextResponse.json(
      { error: 'No meter data available' },
      { status: 500 },
    )
  console.log(
    `API > getData # Meter data contains ${meterData.data.length} entries`,
  )

  const firstMeter = meterData.data[0]
  console.log('API > getData # First meter:', firstMeter)

  if (
    !firstMeter?.availableMeasures ||
    !Array.isArray(firstMeter.availableMeasures) ||
    firstMeter.availableMeasures.length === 0
  )
    return NextResponse.json(
      { error: 'No available measures for meter' },
      { status: 500 },
    )

  const meterId = firstMeter.id
  const meterMeasure = firstMeter.availableMeasures[0]
  console.log(
    `API > getData # Fetching data for meter ${meterId} (${meterMeasure})`,
  )

  const dataResponse = await customFetch(
    new URL(
      `/datasources/${meterId}/${meterMeasure}?from=2024-12-05&to=2024-12-06`,
      config.protectedResourceUrl,
    ),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    },
  )
  console.log(
    `API > getData # data response status: ${dataResponse.status} ${dataResponse.statusText}`,
  )

  if (!dataResponse.ok) {
    const errorText = await dataResponse.text()
    return NextResponse.json(
      {
        error: 'Error fetching data from data server',
        details: errorText,
      },
      { status: 500 },
    )
  }
  console.log('API > getData # Data response received successfully')

  const data = await dataResponse.json()
  console.log('Data:', data)

  return NextResponse.json({ meterData, data })
}
