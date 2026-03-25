import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NOMBRES_MATERIAS: Record<string, string> = {
  curso_ingreso: 'Curso de Ingreso',
  arquitectura_1: 'Arquitectura I',
  sistemas_representacion: 'Sistemas de Representación y Expresión',
  ciencias_basicas: 'Ciencias Básicas Aplicadas al Diseño',
  intro_tecnologia: 'Introducción a la Tecnología',
  intro_diseno: 'Introducción al Diseño',
  arquitectura_2: 'Arquitectura II',
  morfologia_1: 'Morfología I',
  construcciones_1: 'Construcciones I',
  estructuras_1: 'Estructuras I',
  instalaciones_1: 'Instalaciones I',
  historia_critica_1: 'Historia y Crítica I',
  teoria_diseno_1: 'Teoría del Diseño Arquitectónico I',
  arquitectura_3: 'Arquitectura III',
  morfologia_2: 'Morfología II',
  construcciones_2: 'Construcciones II',
  estructuras_2: 'Estructuras II',
  instalaciones_2: 'Instalaciones II',
  historia_critica_2: 'Historia y Crítica II',
  intro_urbanismo: 'Introducción al Urbanismo y al Planeamiento',
  arquitectura_4: 'Arquitectura IV',
  construcciones_3: 'Construcciones III',
  estructuras_3: 'Estructuras III',
  instalaciones_3: 'Instalaciones III',
  urbanismo: 'Urbanismo',
  historia_critica_3: 'Historia y Crítica III',
  teoria_diseno_2: 'Teoría del Diseño Arquitectónico II',
  arquitectura_5: 'Arquitectura V',
  organizacion_produccion_obras: 'Organización y Producción de Obras',
  planeamiento_territorial: 'Planeamiento y Ordenamiento Territorial',
  gestion_habitat_social: 'Gestión y Producción del Hábitat Social',
  tfc: 'Trabajo Final de Carrera',
  ppa: 'Práctica Profesional Asistida',
  org_legislacion_gestion: 'Organización, Legislación y Gestión Profesional',
}

function formatFecha(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

function diasHasta(vencimiento: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const venc = new Date(vencimiento + 'T00:00:00')
  return Math.floor((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

function buildEmailHTML(
  nombre: string,
  regularidades: { materia_id: string; vencimiento: string; dias: number }[]
): string {
  const items = regularidades
    .map(
      ({ materia_id, vencimiento, dias }) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
          <strong>${NOMBRES_MATERIAS[materia_id] ?? materia_id}</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; color: ${dias < 30 ? '#dc2626' : '#ca8a04'};">
          ${formatFecha(vencimiento)} (${dias < 0 ? `venció hace ${Math.abs(dias)} días` : `${dias} días`})
        </td>
      </tr>
    `
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1e3a5f;">FAUU Tracker — Vencimientos de Regularidad</h2>
      <p>Hola ${nombre || 'estudiante'},</p>
      <p>Te recordamos que las siguientes materias tienen regularidades próximas a vencer:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${items}
      </table>
      <p style="margin-top: 20px;">
        Podés revisar y gestionar tus regularidades en{' '}
        <a href="${Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://fauu-tracker.vercel.app'}/perfil">
          tu perfil en FAUU Tracker
        </a>.
      </p>
      <p style="color: #888; font-size: 0.85em; margin-top: 30px;">
        Para desactivar estos recordatorios, ingresá a tu perfil y desactivá las notificaciones por email.
      </p>
    </body>
    </html>
  `
}

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get users with email notifications enabled
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('user_id, dias_anticipacion')
      .eq('email_vencimientos', true)

    if (!prefs || prefs.length === 0) {
      return new Response('No users with email notifications', { status: 200 })
    }

    let emailsSent = 0

    for (const pref of prefs) {
      // Get materia_estados with upcoming vencimientos
      const { data: estados } = await supabase
        .from('materia_estados')
        .select('materia_id, vencimiento_regularidad')
        .eq('user_id', pref.user_id)
        .eq('estado', 'regular_vigente')
        .not('vencimiento_regularidad', 'is', null)

      if (!estados || estados.length === 0) continue

      // dias_anticipacion es ahora integer[] — usamos el máximo del array como umbral
      const diasArray: number[] = Array.isArray(pref.dias_anticipacion)
        ? pref.dias_anticipacion
        : [pref.dias_anticipacion ?? 60]
      const diasMax = Math.max(...diasArray)

      const proximas = estados
        .map((e) => ({
          materia_id: e.materia_id,
          vencimiento: e.vencimiento_regularidad,
          dias: diasHasta(e.vencimiento_regularidad),
        }))
        .filter((e) => e.dias <= diasMax)
        .sort((a, b) => a.dias - b.dias)

      if (proximas.length === 0) continue

      // Get user email and name
      const { data: profile } = await supabase
        .from('profiles')
        .select('nombre_completo')
        .eq('id', pref.user_id)
        .single()

      const { data: authUser } = await supabase.auth.admin.getUserById(pref.user_id)

      const email = authUser?.user?.email
      if (!email) continue

      const nombre = profile?.nombre_completo ?? ''
      const html = buildEmailHTML(nombre, proximas)

      // Send email via Supabase Auth email (uses the configured SMTP)
      await supabase.auth.admin.sendRawEmail({
        to: email,
        subject: `⚠️ ${proximas.length} regularidad${proximas.length > 1 ? 'es' : ''} próxima${proximas.length > 1 ? 's' : ''} a vencer — FAUU Tracker`,
        html,
      })

      emailsSent++

      // Update last_sent timestamp
      await supabase
        .from('notification_preferences')
        .update({ ultimo_email_enviado: new Date().toISOString() })
        .eq('user_id', pref.user_id)
    }

    return new Response(
      JSON.stringify({ ok: true, emailsSent }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Error en check-vencimientos:', err)
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
