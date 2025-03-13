// app/global-error.tsx
'use client'

import { ReactNode } from 'react';

interface GlobalErrorProps {
  error: Error;
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps): ReactNode {
  return (
    <html>
    <body>
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-red-700 mb-4">Something went wrong!</h2>
        <p className="mb-6 text-gray-700">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={reset}
          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </div>
    </body>
    </html>
  );
}
