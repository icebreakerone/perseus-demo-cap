// app/auth/login/error.tsx
'use client'

import { useEffect } from 'react';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function LoginError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Login error:', error);
  }, [error]);

  return (
    <div className="p-8 bg-red-50 rounded-lg">
      <h2 className="text-xl font-bold text-red-700 mb-4">Authentication Error</h2>
      <p className="mb-4">{error.message || 'Failed to initiate login process'}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
  );
}
