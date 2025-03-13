// app/auth/callback/error.tsx
'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ErrorProps {
  error: Error;
}

export default function CallbackError({ error }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    console.error('Authentication callback error:', error);
  }, [error]);

  return (
    <div className="p-8 bg-red-50 rounded-lg">
      <h2 className="text-xl font-bold text-red-700 mb-4">Authentication Failed</h2>
      <p className="mb-4">There was a problem completing the authentication process.</p>
      <button
        onClick={() => router.push('/')}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Return Home
      </button>
    </div>
  );
}
