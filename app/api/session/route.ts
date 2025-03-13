// app/api/session/route.ts
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  const session = await getSession();

  return NextResponse.json({
    isLoggedIn: session.isLoggedIn,
    // Don't expose sensitive information like tokens
  });
}
