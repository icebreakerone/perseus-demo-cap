// app/auth/logout/route.ts
import { getSession, clientConfig, getClientConfig } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  const issuer = await getClientConfig();

  // Clear session
  session.isLoggedIn = false;
  session.access_token = undefined;
  session.code_verifier = undefined;
  await session.save();

  // Redirect to identity provider's logout endpoint if available
  const endSessionEndpoint = issuer.serverMetadata().end_session_endpoint;
  if (endSessionEndpoint && session.access_token) {
    const logoutUrl = new URL(endSessionEndpoint);
    logoutUrl.searchParams.set('client_id', clientConfig.client_id);
    logoutUrl.searchParams.set('post_logout_redirect_uri', clientConfig.post_login_route);

    return Response.redirect(logoutUrl.href);
  }

  // If no end session endpoint or no token, just redirect to home
  return Response.redirect(clientConfig.post_login_route);
}
