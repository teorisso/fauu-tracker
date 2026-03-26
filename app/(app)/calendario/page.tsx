import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MateriaEstado } from '@/lib/types'
import type { MesaAnotadaInfo } from '@/components/calendario/CalendarioMesas'
import { CalendarioPageClient } from '@/components/calendario/CalendarioPageClient'

export default async function CalendarioPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rawEstados } = await supabase
    .from('materia_estados')
    .select('*')
    .eq('user_id', user.id)

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

  const { data: rawMesas } = await supabase
    .from('mesas_usuario')
    .select('materia_id, fecha, anotado, condicion')
    .eq('user_id', user.id)
    .eq('anotado', true)

  const mesasAnotadas: Record<string, MesaAnotadaInfo> = {}
  if (rawMesas) {
    for (const m of rawMesas) {
      mesasAnotadas[`${m.materia_id}-${m.fecha}`] = {
        anotado: m.anotado,
        condicion: (m.condicion as 'regular' | 'libre') ?? 'regular',
      }
    }
  }

  return (
    <CalendarioPageClient
      userId={user.id}
      estados={estados}
      mesasAnotadasInit={mesasAnotadas}
    />
  )
}
