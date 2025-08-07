

// This API route is no longer necessary as data is now read
// directly from the filesystem in server components via `src/lib/storage.ts`.
// This file is being cleared to prevent conflicts and ensure the new
// data access pattern is used exclusively.

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'This API endpoint is deprecated.' }, { status: 410 });
}

export async function POST() {
    return NextResponse.json({ error: 'This API endpoint is deprecated.' }, { status: 410 });
}
