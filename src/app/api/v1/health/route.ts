import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  let database: 'connected' | 'disconnected' = 'disconnected'

  try {
    await db.$queryRaw`SELECT 1`
    database = 'connected'
  } catch {
    // DB unreachable — fall through to 503 below
  }

  try {
    if (database !== 'connected') {
      return NextResponse.json(
        {
          status: 'error',
          database,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'ok',
      database,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Health check failed' },
      { status: 500 }
    )
  }
}
