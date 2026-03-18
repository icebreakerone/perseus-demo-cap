import { createCustomFetch, getClientConfig, getSession } from '@/lib/auth'
import { getClientConfigPromise } from '@lib/clientConfig'
import { NextRequest, NextResponse } from 'next/server'

type TokenResponse = {
  access_token?: string
}

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production, replace with your specific domain
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSession()
  const issuer = await getClientConfig()
  const customFetch = await createCustomFetch()
  const clientConfig = await getClientConfigPromise()

  let accessToken = session.access_token

  if (!accessToken) {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')

    if (!code)
      return NextResponse.json(
        { error: 'Missing access token or authorization code.' },
        { status: 401, headers: corsHeaders },
      )

    const tokenEndpoint = issuer.serverMetadata().token_endpoint

    if (!tokenEndpoint)
      return NextResponse.json(
        { error: 'Token endpoint is not available in the issuer metadata.' },
        { status: 500, headers: corsHeaders },
      )

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: clientConfig.redirect_uri,
      client_id: clientConfig.client_id,
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
        { status: 500, headers: corsHeaders },
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
        { status: 500, headers: corsHeaders },
      )

    session.access_token = tokenData.access_token
    session.isLoggedIn = true
    await session.save()

    accessToken = tokenData.access_token
  }

  console.log('API > getData # Using access token:', accessToken)

  const meterDataResponse = await customFetch(
    new URL('/datasources/', clientConfig.protectedResourceUrl),
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
      { status: 500, headers: corsHeaders },
    )
  }
  console.log('API > getData # Meter data response received successfully')

  const meterData = await meterDataResponse.json()
  console.log('API > getData # Meter data:', meterData)

  if (!meterData?.data || !Array.isArray(meterData.data))
    return NextResponse.json(
      { error: 'No meter data available' },
      { status: 500, headers: corsHeaders },
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
      { status: 500, headers: corsHeaders },
    )

  const meterId = firstMeter.id
  const meterMeasure = firstMeter.availableMeasures[0]
  console.log(
    `API > getData # Fetching data for meter ${meterId} (${meterMeasure})`,
  )

  const dataResponse = await customFetch(
    new URL(
      `/datasources/${meterId}/${meterMeasure}?from=2024-12-05&to=2024-12-06`,
      clientConfig.protectedResourceUrl,
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
      { status: 500, headers: corsHeaders },
    )
  }
  console.log('API > getData # Data response received successfully')

  const data = await dataResponse.json()
  console.log('Data:', data)

  return NextResponse.json({ meterData, data }, { headers: corsHeaders })
}
