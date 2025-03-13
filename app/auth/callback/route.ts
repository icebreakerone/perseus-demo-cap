// app/auth/callback/route.ts
import { getSession, getClientConfig, clientConfig, createCustomFetch } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  const issuer = await getClientConfig();
  const customFetch = createCustomFetch();

  try {
    // Get the authorization code from the URL
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      throw new Error('No authorization code received');
    }

    // Exchange code for tokens using mTLS
    const tokenEndpoint = issuer.serverMetadata().token_endpoint;
    if (!tokenEndpoint) {
      throw new Error('Token endpoint not found');
    }

    const tokenResponse = await customFetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientConfig.client_id,
        redirect_uri: clientConfig.redirect_uri,
        code_verifier: session.code_verifier || '',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token request failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }

    const tokens = await tokenResponse.json() as { access_token: string };

    // Store tokens in session
    session.access_token = tokens.access_token;
    session.isLoggedIn = true;
    await session.save();

    // Redirect to post-login route
    return Response.redirect(clientConfig.post_login_route);
  } catch (error) {
    console.error('Callback error:', error);
    return new Response(
      JSON.stringify({
        error: 'Authentication callback error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
