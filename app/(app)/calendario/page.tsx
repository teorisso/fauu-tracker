import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MateriaEstado } from '@/lib/types'
import { CalendarioMesas, type MesaAnotadaInfo } from '@/components/calendario/CalendarioMesas'
import { CountdownBanner } from '@/components/CountdownBanner'

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
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Calendario de Mesas 2026</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mesas de examen de Arquitectura Plan 2018 — FAU UNNE.
          Marcá en qué turnos te vas a inscribir.
        </p>
      </div>

      <CountdownBanner />

      <div className="mt-4">
      <CalendarioMesas
        userId={user.id}
        estados={estados}
        mesasAnotadasInit={mesasAnotadas}
      />
      </div>

      <div className="mt-8 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium">Leyenda</p>
        <ul className="mt-2 space-y-1">
          <li className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            Regular: tenés regularidad vigente y correlatividades completas
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            Libre: podés rendir aunque no tengas regularidad vigente
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-muted-foreground/40" />
            No podés rendir: correlatividades incompletas o materia ya aprobada
          </li>
        </ul>
        <p className="mt-3 text-xs">
          Las fechas son según el Calendario Académico 2026 (RES-2025-542-CD-ARQ#UNNE).
          Para años futuros, las mesas se actualizarán cuando se publique el calendario oficial.
        </p>
      </div>
    </div>
  )
}
