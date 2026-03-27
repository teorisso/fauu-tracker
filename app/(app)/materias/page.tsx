import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from '@/components/DashboardClient'
import { MateriaEstado, Seminario, UserProfile } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: profile, error: profileError },
    { data: rawEstados, error: estadosError },
    { data: rawSeminarios, error: seminariosError },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('materia_estados').select('*').eq('user_id', user.id),
    supabase.from('seminarios').select('*').eq('user_id', user.id),
  ])

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('[materias] Error al cargar perfil:', profileError.message)
  }
  if (estadosError) {
    console.error('[materias] Error al cargar estados:', estadosError.message)
  }
  if (seminariosError) {
    console.error('[materias] Error al cargar seminarios:', seminariosError.message)
  }

  const userProfile: UserProfile = {
    id: user.id,
    nombre_completo: profile?.nombre_completo ?? undefined,
    carrera_completada: profile?.carrera_completada ?? false,
  }

  const estados: Record<string, MateriaEstado> = {}
  if (rawEstados) {
    for (const row of rawEstados) {
      estados[row.materia_id] = {
        materia_id: row.materia_id,
        estado: row.estado,
        anio_cursado: row.anio_cursado ?? undefined,
        cuatrimestre: row.cuatrimestre ?? undefined,
        nota: row.nota != null ? Number(row.nota) : undefined,
        intentos_previos: row.intentos_previos ?? 0,
        fecha_regularidad: row.fecha_regularidad ?? undefined,
        fecha_aprobacion: row.fecha_aprobacion ?? undefined,
        vencimiento_regularidad: row.vencimiento_regularidad ?? undefined,
      }
    }
  }

  const seminarios: Seminario[] = (rawSeminarios ?? []).map((row) => ({
    numero: row.numero as 1 | 2 | 3,
    nombre: row.nombre ?? undefined,
    area: row.area ?? undefined,
    estado: row.estado,
    anio_cursado: row.anio_cursado ?? undefined,
    cuatrimestre: row.cuatrimestre ?? undefined,
    nota: row.nota != null ? Number(row.nota) : undefined,
  }))

  return (
    <DashboardClient
      profile={userProfile}
      initialEstados={estados}
      initialSeminarios={seminarios}
    />
  )
}
