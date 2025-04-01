import { generateAuthUrl, getSession } from '@lib/auth'

export async function GET(): Promise<Response> {
  const session = await getSession()

  try {
    const authUrl = await generateAuthUrl(session)
    return Response.redirect(authUrl)
  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({
        error: 'Authentication error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
