import { createCustomFetch, getSession } from '@/lib/auth'
import { getClientConfigPromise } from '@lib/clientConfig'
import { lastTwelveCompleteMonths } from '@lib/dateRange'
import { NextResponse } from 'next/server'

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

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  const customFetch = await createCustomFetch()
  const clientConfig = await getClientConfigPromise()

  const accessToken = session.access_token
  if (!accessToken)
    return NextResponse.json(
      { error: 'Not logged in' },
      { status: 401, headers: corsHeaders },
    )

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
  const range = lastTwelveCompleteMonths()
  console.log(
    `API > getData # Fetching data for meter ${meterId} (${meterMeasure}) from ${range.from} to ${range.to}`,
  )

  const dataUrl = new URL(
    `/datasources/${encodeURIComponent(meterId)}/${encodeURIComponent(meterMeasure)}`,
    clientConfig.protectedResourceUrl,
  )
  // Assigned wholesale rather than via searchParams.set so any query string on
  // the configured base URL is replaced rather than merged into.
  dataUrl.search = new URLSearchParams({
    from: range.from,
    to: range.to,
  }).toString()

  const dataResponse = await customFetch(dataUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      // Required: the resource API refuses windows longer than 60 days unless
      // the client accepts a compressed response. undici still decodes the
      // body for us.
      'Accept-Encoding': 'gzip',
    },
  })
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
  // Summarised, not dumped: a year of half-hourly readings is several MB.
  console.log(
    `API > getData # ${data?.data?.length ?? 0} readings for ${range.from} to ${range.to}`,
  )

  // `data` is passed through verbatim so the demo shows what the EDP actually
  // returned; `range` tells the client which window was asked for, so the
  // chart's month spine does not depend on the browser's clock.
  return NextResponse.json({ meterData, data, range }, { headers: corsHeaders })
}
