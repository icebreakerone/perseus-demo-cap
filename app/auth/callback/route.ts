import {
  createCustomFetch,
  getClientConfig,
  getSession,
  initializeClientConfig,
} from '@/lib/auth'
import { checkAuthorizationResponse, mtlsEndpoint } from '@lib/discovery'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession()
  const issuer = await getClientConfig()
  const customFetch = await createCustomFetch()
  const clientConfig = await initializeClientConfig()

  try {
    const code = checkAuthorizationResponse(
      new URL(request.url).searchParams,
      issuer,
      session.state,
    )
    // One use only, like the code it guards
    session.state = undefined

    console.log('Exchanging code for tokens using mTLS...')
    const tokenEndpoint = mtlsEndpoint(issuer, 'token_endpoint')
    console.log('Token endpoint:', tokenEndpoint)

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
      throw new Error(
        `Token request failed: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorText}`,
      )
    }

    const tokenSet = (await tokenResponse.json()) as { access_token?: string }

    // Store tokens in session
    session.access_token = tokenSet.access_token
    session.isLoggedIn = true
    await session.save()

    console.log('Token exchange successful')

    // Redirect to post-login route
    return Response.redirect(clientConfig.post_login_route)
  } catch (error) {
    console.error('Callback error:', error)
    return new Response(
      JSON.stringify({
        error: 'Authentication callback error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
