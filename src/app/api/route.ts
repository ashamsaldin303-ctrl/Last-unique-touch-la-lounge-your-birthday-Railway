import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: 'Last Unique Touch API',
    version: '1.0.0',
    docs: '/api/v1/health',
  });
}
