import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'

/**
 * Valida que el parámetro `next` sea una ruta interna relativa para evitar
 * open redirect. Solo acepta paths que empiezan con `/` y no tienen protocolo.
 */
function safeNextPath(next: string | null): string {
  if (!next) return '/materias'
  if (
    !next.startsWith('/') ||
    next.startsWith('//') ||
    next.includes('://')
  ) {
    return '/materias'
  }
  return next
}

/**
 * Registra la aceptación de T&C si el usuario aún no lo hizo.
 * Idempotente: usa IS NULL para no sobreescribir aceptaciones previas.
 */
async function markTosAccepted(supabase: ReturnType<typeof createClient>, userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ tos_accepted_at: new Date().toISOString() })
    .eq('id', userId)
    .is('tos_accepted_at', null)

  if (error) {
    console.warn('[callback] No se pudo registrar tos_accepted_at:', error.message)
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const nextPath = safeNextPath(searchParams.get('next'))

  // Supabase envía error params directamente cuando el link es inválido o expiró
  const errorParam = searchParams.get('error_description')
  if (errorParam) {
    const message = encodeURIComponent(errorParam)
    return NextResponse.redirect(`${origin}/login?error=${message}`)
  }

  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  const supabase = createClient()

  // Flujo OAuth (Google) — intercambia el código de autorización por sesión
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      await markTosAccepted(supabase, data.user.id)
      return NextResponse.redirect(`${origin}${nextPath}`)
    }
    console.error('[callback] exchangeCodeForSession falló:', error?.message)
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  // Flujo magic link — verifica el token hash OTP
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error && data.user) {
      await markTosAccepted(supabase, data.user.id)
      return NextResponse.redirect(`${origin}${nextPath}`)
    }
    console.error('[callback] verifyOtp falló:', error?.message)
    return NextResponse.redirect(`${origin}/login?error=link_expired`)
  }

  // Parámetros de auth ausentes o inválidos
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
