'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signInWithGoogle() {
  const supabase = createClient()
  const origin = headers().get('origin')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/callback`,
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
  const origin = headers().get('origin')

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/callback`,
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
