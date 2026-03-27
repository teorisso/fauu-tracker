import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MateriaEstado } from '@/lib/types'
import { GuaraniImport } from '@/components/guarani/GuaraniImport'
import { VencimientoEditor } from '@/components/guarani/VencimientoEditor'
import { NotificationPrefs } from '@/components/perfil/NotificationPrefs'
import { MATERIAS } from '@/lib/data/materias'

export default async function PerfilPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rawEstados, error: estadosError } = await supabase
    .from('materia_estados')
    .select('*')
    .eq('user_id', user.id)

  if (estadosError) {
    console.error('[perfil] Error al cargar estados:', estadosError.message)
  }

  const estadosActuales: Record<string, MateriaEstado> = {}
  if (rawEstados) {
    for (const row of rawEstados) {
      estadosActuales[row.materia_id] = {
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

  const { data: notifPrefs, error: notifError } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (notifError) {
    console.error('[perfil] Error al cargar preferencias de notificación:', notifError.message)
  }

  // Materias con regularidad vigente (o vencida) que pueden tener vencimiento
  const materiasConRegularidad = MATERIAS.filter((m) => {
    const e = estadosActuales[m.id]
    return e && (e.estado === 'regular_vigente' || e.estado === 'regular_vencida')
  }).map((m) => ({
    materia: m,
    estado: estadosActuales[m.id],
  }))

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6 space-y-10">
      <h1 className="text-2xl font-bold">Perfil</h1>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Importar historial académico</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Importá tus materias desde el archivo .xls de Historia Académica del SIU Guaraní.
            Se registran las fechas exactas de aprobación y regularidad.
          </p>
        </div>
        <GuaraniImport userId={user.id} estadosActuales={estadosActuales} />
      </section>

      {materiasConRegularidad.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Vencimientos de regularidad</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ingresá las fechas de vencimiento desde tu historial en el SIU Guaraní para
              activar las alertas. Las fechas aproximadas se calculan automáticamente a partir
              de la fecha de regularidad.
            </p>
          </div>
          <VencimientoEditor
            userId={user.id}
            materiasConRegularidad={materiasConRegularidad}
          />
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Notificaciones por email</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recibí un aviso por email cuando alguna regularidad esté próxima a vencer.
          </p>
        </div>
        <NotificationPrefs
          userId={user.id}
          initialEmailEnabled={notifPrefs?.email_vencimientos ?? true}
          initialDiasAnticipacion={
            Array.isArray(notifPrefs?.dias_anticipacion)
              ? (notifPrefs.dias_anticipacion as number[])
              : notifPrefs?.dias_anticipacion != null
                ? [notifPrefs.dias_anticipacion as unknown as number]
                : [60]
          }
        />
      </section>

    </div>
  )
}
