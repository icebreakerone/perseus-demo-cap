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
          <a href="/Users/uxdw/Documents/_REPOS/icebreakerone/cap-demo/lib/logout">
            Logout
          </a>
        </div>
      ) : (
        <div>
          <p>You are not logged in.</p>
          <a href="/Users/uxdw/Documents/_REPOS/icebreakerone/cap-demo/lib/login">
            Login
          </a>
        </div>
      )}
    </div>
  )
}
