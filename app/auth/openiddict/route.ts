// import { clientConfig, getClientConfig, getSession } from '@lib/auth'
// import { getClientConfig, getSession } from '@lib/auth'
import { headers } from 'next/headers'
// import { NextRequest, NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // const session = await getSession()
  // const client = await getClientConfig()

  const headersList = await headers()
  const host =
    headersList.get('x-forwarded-host') ||
    headersList.get('host') ||
    'localhost'
  const protocol = headersList.get('x-forwarded-proto') || 'https'
  const currentUrl = new URL(
    `${protocol}://${host}${request.nextUrl.pathname}${request.nextUrl.search}`,
  )
  console.info('Current URL:', currentUrl.toString())
  /*
  const params = client.callbackParams(currentUrl.toString());

  try {
    const tokens = await client.callback(
      clientConfig.redirect_uri,
      params,
      { code_verifier: session.code_verifier }
    );

    // Store tokens in session
    session.access_token = tokens.access_token;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.redirect(clientConfig.post_login_route);
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 400 });
  }
*/
}
