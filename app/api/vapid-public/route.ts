import { NextResponse } from 'next/server'

/**
 * GET /api/vapid-public — clave pública VAPID en runtime (ver VAPID_PUBLIC_KEY en Vercel).
 */
export const dynamic = 'force-dynamic'

export function GET() {
  const raw =
    process.env.VAPID_PUBLIC_KEY?.trim() ??
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ??
    null

  return NextResponse.json({ publicKey: raw })
}
