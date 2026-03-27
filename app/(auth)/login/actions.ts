'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

/**
 * Devuelve la URL base de la app. Prioriza el header `origin` de la request,
 * luego variables de entorno conocidas de Vercel, y finalmente localhost.
 * Evita que `redirectTo` quede malformado si `origin` es null en ciertos
 * contextos (ej. server actions invocadas por bots o tests).
 */
function getBaseUrl(): string {
  const origin = headers().get('origin')
  if (origin) return origin
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export async function signInWithGoogle() {
  const supabase = createClient()
  const baseUrl = getBaseUrl()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${baseUrl}/callback`,
    },
  })

  if (error) {
    redirect('/login?error=No se pudo iniciar sesión con Google')
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signInWithMagicLink(email: string) {
  const supabase = createClient()
  const baseUrl = getBaseUrl()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${baseUrl}/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/')
}
