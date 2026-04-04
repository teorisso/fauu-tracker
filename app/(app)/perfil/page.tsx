import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MateriaEstado, Seminario } from '@/lib/types'
import { GuaraniImport } from '@/components/guarani/GuaraniImport'
import { VencimientoEditor } from '@/components/guarani/VencimientoEditor'
import { NotificationPrefs } from '@/components/perfil/NotificationPrefs'
import { PerfilGamification } from '@/components/gamification/PerfilGamification'
import { MATERIAS } from '@/lib/data/materias'
import { parseAlertRules } from '@/lib/notifications'

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

  const { count: pushSubCount } = await supabase
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Materias con regularidad vigente (o vencida) que pueden tener vencimiento
  const materiasConRegularidad = MATERIAS.filter((m) => {
    const e = estadosActuales[m.id]
    return e && (e.estado === 'regular_vigente' || e.estado === 'regular_vencida')
  }).map((m) => ({
    materia: m,
    estado: estadosActuales[m.id],
  }))

  // Fetch profile data
  const { data: profileData } = await supabase
    .from('profiles')
    .select('nombre_completo')
    .eq('id', user.id)
    .maybeSingle()

  // Fetch seminarios
  const { data: rawSeminarios } = await supabase
    .from('seminarios')
    .select('*')
    .eq('user_id', user.id)

  const seminarios: Seminario[] = (rawSeminarios ?? []).map((s: Record<string, unknown>) => ({
    numero: s.numero as 1 | 2 | 3,
    nombre: (s.nombre as string) ?? undefined,
    area: s.area as Seminario['area'],
    estado: (s.estado as Seminario['estado']) ?? 'sin_cursar',
    anio_cursado: (s.anio_cursado as number) ?? undefined,
    cuatrimestre: (s.cuatrimestre as 1 | 2) ?? undefined,
    nota: s.nota != null ? Number(s.nota) : undefined,
  }))

  // Completar los 3 seminarios
  for (const n of [1, 2, 3] as const) {
    if (!seminarios.find((s) => s.numero === n)) {
      seminarios.push({ numero: n, estado: 'sin_cursar' })
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6 space-y-10">
      <h1 className="text-2xl font-bold">Perfil</h1>

      <section className="space-y-4">
        <PerfilGamification
          nombre={profileData?.nombre_completo ?? ''}
          estados={estadosActuales}
          seminarios={seminarios}
        />
      </section>

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
          <h2 className="text-lg font-semibold">Alertas y notificaciones</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configurá recordatorios por correo o por notificación del navegador para vencimientos de
            regularidad y para las mesas en las que te anotaste.
          </p>
        </div>
        <NotificationPrefs
          userId={user.id}
          initialAlertRules={parseAlertRules(notifPrefs?.alert_rules)}
          initialPushSubscriptionCount={pushSubCount ?? 0}
        />
      </section>

    </div>
  )
}
