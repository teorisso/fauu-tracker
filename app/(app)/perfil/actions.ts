'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Elimina la cuenta del usuario autenticado y todos sus datos asociados.
 * El borrado en cascada se encarga de: profiles, materia_estados, seminarios,
 * notification_preferences, mesas_usuario, mesas_custom, push_subscriptions, alert_rules.
 */
export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado.' }
  }

  // Necesitamos un cliente admin para borrar el usuario de auth.users.
  // Importamos createClient de Supabase con service role para esta operación.
  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Cerrar sesión primero para invalidar tokens
  await supabase.auth.signOut()

  // Borrar el usuario de auth.users → dispara CASCADE en profiles → borra todo
  const { error } = await adminClient.auth.admin.deleteUser(user.id)

  if (error) {
    console.error('[deleteAccount] Error al eliminar usuario:', error.message)
    return { error: 'No se pudo eliminar la cuenta. Intentá de nuevo.' }
  }

  redirect('/?cuenta_eliminada=1')
}

/**
 * Registra la aceptación de los T&C para el usuario autenticado.
 * Idempotente: si ya aceptó, no actualiza el timestamp anterior.
 */
export async function acceptTerms(): Promise<{ error?: string }> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ tos_accepted_at: new Date().toISOString() })
    .eq('id', user.id)
    .is('tos_accepted_at', null) // solo si aún no aceptó

  if (error) {
    console.error('[acceptTerms] Error:', error.message)
    return { error: 'No se pudo registrar el consentimiento.' }
  }

  return {}
}
