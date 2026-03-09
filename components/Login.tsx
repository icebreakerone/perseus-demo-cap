'use client'

import { useSession } from '@/hooks/useSession'

export default function Login() {
  const { session, loading } = useSession()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {session?.isLoggedIn ? (
        <div>
          <p>You are logged in!</p>
          <a href="/auth/logout">Logout</a>
        </div>
      ) : (
        <div>
          <p>You are not logged in.</p>
          <a href="/auth/login">Login</a>
        </div>
      )}
    </div>
  )
}
