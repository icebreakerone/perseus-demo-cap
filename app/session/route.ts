import { getSession } from '@lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getSession();
  return NextResponse.json(session);
}
