import {
  createCustomFetch,
  getClientConfig,
  getSession,
  initializeClientConfig,
} from '@/lib/auth'
import * as openid from 'openid-client'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession()
  const issuer = await getClientConfig()
  const customFetch = await createCustomFetch()
  const clientConfig = await initializeClientConfig()

  try {
    // Get the authorization code from the URL
    const url = new URL(request.url)
    const code = url.searchParams.get('code')

    if (!code) throw new Error('No authorization code received')

    // Create openid-client with mTLS support
    const oauthClient = new issuer.Client({
      client_id: clientConfig.client_id,
      redirect_uris: [clientConfig.redirect_uri],
      response_types: ['code'],
      token_endpoint_auth_method: 'tls_client_auth',
    })

    console.log('Exchanging code for tokens using mTLS...')
    console.log('Token endpoint:', issuer.serverMetadata().token_endpoint)

    // Use openid-client's built-in token exchange with mTLS
    const tokenSet = await oauthClient.callback(
      clientConfig.redirect_uri,
      { code },
      { code_verifier: session.code_verifier },
      {
        [openid.customFetch]: customFetch, // Use mTLS for token request
      },
    )

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
