import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/materias'

  // Supabase sends error params directly when the link is invalid/expired
  const errorParam = searchParams.get('error_description')
  if (errorParam) {
    const message = encodeURIComponent(errorParam)
    return NextResponse.redirect(`${origin}/login?error=${message}`)
  }

  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  const supabase = createClient()

  // OAuth flow (Google) — exchanges authorization code for session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Magic link flow — verifies the OTP token hash
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
