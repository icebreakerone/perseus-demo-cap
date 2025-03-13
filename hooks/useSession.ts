"use client";

import { SessionData } from '@lib/auth';
import { useEffect, useState } from 'react';

export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/session');
        const data = await res.json();
        setSession(data);
      } catch (error) {
        console.error('Failed to fetch session:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, []);

  return { session, loading };
}
