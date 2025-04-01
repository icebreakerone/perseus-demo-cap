// app/global-error.tsx
'use client'

import { ReactNode } from 'react'

interface GlobalErrorProps {
  error: Error
  reset: () => void
}

export default function GlobalError({
  error,
  reset,
}: GlobalErrorProps): ReactNode {
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
            <h2 className="mb-4 text-2xl font-bold text-red-700">
              Something went wrong!
            </h2>
            <p className="mb-6 text-gray-700">
              {error.message || 'An unexpected error occurred'}
            </p>
            <button
              className="w-full rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              onClick={reset}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
