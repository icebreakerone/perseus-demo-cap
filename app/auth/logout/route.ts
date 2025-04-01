// import { clientConfig, getClientConfig, getSession } from '@/lib/auth'
import { getClientConfig, getSession } from '@/lib/auth'

export async function GET(): Promise<Response> {
  const session = await getSession()
  const issuer = await getClientConfig()

  const postLoggedOutRoute: string = '/logged-out'

  // Clear session
  session.isLoggedIn = false
  session.access_token = undefined
  session.code_verifier = undefined
  await session.save()

  // Redirect to identity provider's logout endpoint if available
  const endSessionEndpoint = issuer.serverMetadata().end_session_endpoint
  if (endSessionEndpoint && session.access_token) {
    const logoutUrl = new URL(endSessionEndpoint)
    logoutUrl.searchParams.set(
      'client_id',
      process.env.NEXT_PUBLIC_CLIENT_ID as string,
    )
    logoutUrl.searchParams.set('post_logout_redirect_uri', postLoggedOutRoute)

    return Response.redirect(logoutUrl.href)
  }

  // If no end session endpoint or no token, just redirect to home
  return Response.redirect(postLoggedOutRoute)
}
