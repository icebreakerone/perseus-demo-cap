// app/auth/login/error.tsx
'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error
  reset: () => void
}

export default function LoginError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Login error:', error)
  }, [error])

  return (
    <div className="rounded-lg bg-red-50 p-8">
      <h2 className="mb-4 text-xl font-bold text-red-700">
        Authentication Error
      </h2>
      <p className="mb-4">
        {error.message || 'Failed to initiate login process'}
      </p>
      <button
        className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        onClick={reset}
      >
        Try Again
      </button>
    </div>
  )
}
