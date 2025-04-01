'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ErrorProps {
  error: Error
}

export default function CallbackError({ error }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    console.error('Authentication callback error:', error)
  }, [error])

  return (
    <div className="rounded-lg bg-red-50 p-8">
      <h2 className="mb-4 text-xl font-bold text-red-700">
        Authentication Failed
      </h2>
      <p className="mb-4">
        There was a problem completing the authentication process.
      </p>
      <button
        className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        onClick={() => router.push('/')}
      >
        Return Home
      </button>
    </div>
  )
}
