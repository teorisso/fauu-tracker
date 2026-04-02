import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

/** Huso horario UNNE / Resistencia (Argentina). */
const ALERT_TZ = 'America/Argentina/Cordoba'

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

interface AlertRule {
  scope: 'regularidad' | 'mesa'
  channel: 'email' | 'push'
  amount: number
  unit: 'days' | 'weeks'
}

function todayYmdInAlertTz(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: ALERT_TZ })
}

function diasRestantes(fechaEvento: string, todayYmd: string): number {
  const [y1, m1, d1] = fechaEvento.split('-').map(Number)
  const [y2, m2, d2] = todayYmd.split('-').map(Number)
  const tEv = Date.UTC(y1, m1 - 1, d1)
  const tTo = Date.UTC(y2, m2 - 1, d2)
  return Math.round((tEv - tTo) / 86400000)
}

function leadDaysFromRule(rule: AlertRule): number {
  const n = Math.max(1, Math.floor(Number(rule.amount)))
  return rule.unit === 'weeks' ? n * 7 : n
}

function parseAlertRules(raw: unknown): AlertRule[] {
  if (!Array.isArray(raw)) return []
  const out: AlertRule[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const scope = r.scope === 'mesa' ? 'mesa' : 'regularidad'
    const channel = r.channel === 'push' ? 'push' : 'email'
    const unit = r.unit === 'weeks' ? 'weeks' : 'days'
    const amount = Math.max(1, Math.floor(Number(r.amount)) || 1)
    out.push({ scope, channel, amount, unit })
  }
  return out
}

function formatFecha(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

function setupWebPush(): boolean {
  const pub = Deno.env.get('VAPID_PUBLIC_KEY')
  const priv = Deno.env.get('VAPID_PRIVATE_KEY')
  const subject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contact@fauu-tracker.local'
  if (!pub || !priv) {
    console.warn('check-vencimientos: VAPID keys missing; push rules will be skipped')
    return false
  }
  webpush.setVapidDetails(subject, pub, priv)
  return true
}

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const pushOk = setupWebPush()
    const today = todayYmdInAlertTz()
    const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://fauu-tracker.vercel.app'

    const { data: prefsRows, error: prefsErr } = await supabase
      .from('notification_preferences')
      .select('user_id, alert_rules')

    if (prefsErr) throw prefsErr
    if (!prefsRows?.length) {
      return new Response(JSON.stringify({ ok: true, emailsSent: 0, pushSent: 0, message: 'no prefs' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let emailsSent = 0
    let pushSent = 0

    for (const pref of prefsRows) {
      const rules = parseAlertRules(pref.alert_rules)
      if (rules.length === 0) continue

      const { data: profile } = await supabase
        .from('profiles')
        .select('nombre_completo')
        .eq('id', pref.user_id)
        .maybeSingle()

      const nombre = profile?.nombre_completo ?? ''

      const { data: authUser } = await supabase.auth.admin.getUserById(pref.user_id)
      const email = authUser?.user?.email ?? null

      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth')
        .eq('user_id', pref.user_id)

      const { data: estados } = await supabase
        .from('materia_estados')
        .select('materia_id, vencimiento_regularidad')
        .eq('user_id', pref.user_id)
        .eq('estado', 'regular_vigente')
        .not('vencimiento_regularidad', 'is', null)

      const { data: mesasRows } = await supabase
        .from('mesas_usuario')
        .select('materia_id, fecha')
        .eq('user_id', pref.user_id)
        .eq('anotado', true)
        .gte('fecha', today)

      const proximaMesaPorMateria = new Map<string, string>()
      for (const row of mesasRows ?? []) {
        const cur = proximaMesaPorMateria.get(row.materia_id)
        if (!cur || row.fecha < cur) proximaMesaPorMateria.set(row.materia_id, row.fecha)
      }

      for (const rule of rules) {
        const leadDays = leadDaysFromRule(rule)

        if (rule.scope === 'regularidad') {
          for (const e of estados ?? []) {
            const v = e.vencimiento_regularidad as string
            const dias = diasRestantes(v, today)
            if (dias < 0) continue
            if (dias > leadDays) continue

            const eventKey = `regularidad:${e.materia_id}:${v}`
            const { data: dup } = await supabase
              .from('notification_deliveries')
              .select('id')
              .eq('user_id', pref.user_id)
              .eq('scope', 'regularidad')
              .eq('event_key', eventKey)
              .eq('channel', rule.channel)
              .eq('lead_days', leadDays)
              .maybeSingle()

            if (dup) continue

            const label = NOMBRES_MATERIAS[e.materia_id] ?? e.materia_id
            const bodyText = `Regularidad de «${label}»: vence el ${formatFecha(v)}. Faltan ${dias} día(s).`

            let delivered = false
            if (rule.channel === 'email') {
              if (!email) continue
              const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
<h2 style="color:#1e3a5f;">FAUU Tracker — Regularidad</h2>
<p>Hola ${nombre || 'estudiante'},</p>
<p>${bodyText}</p>
<p><a href="${appUrl}/perfil">Abrir perfil</a></p>
<p style="color:#888;font-size:0.85em;">Recordatorios por día calendario (huso Argentina, UNNE). No reflejan la hora exacta en el SIU.</p>
</body></html>`
              try {
                await supabase.auth.admin.sendRawEmail({
                  to: email,
                  subject: `Regularidad próxima a vencer — ${label} — FAUU Tracker`,
                  html,
                })
                emailsSent++
                delivered = true
              } catch (sendErr) {
                console.error('sendRawEmail regularidad', sendErr)
                continue
              }
            } else {
              if (!pushOk || !subs?.length) continue
              const payload = JSON.stringify({
                title: 'FAUU Tracker — Regularidad',
                body: bodyText,
                url: `${appUrl}/perfil`,
              })
              for (const s of subs) {
                try {
                  await webpush.sendNotification(
                    { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                    payload
                  )
                  pushSent++
                  delivered = true
                } catch (err: unknown) {
                  const st = (err as { statusCode?: number })?.statusCode
                  if (st === 404 || st === 410) {
                    await supabase.from('push_subscriptions').delete().eq('id', s.id)
                  } else console.error('webpush regularidad', err)
                }
              }
              if (!delivered) continue
            }

            if (delivered) {
              await supabase.from('notification_deliveries').insert({
                user_id: pref.user_id,
                scope: 'regularidad',
                event_key: eventKey,
                channel: rule.channel,
                lead_days: leadDays,
              })
            }
          }
        }

        if (rule.scope === 'mesa') {
          for (const [materiaId, fecha] of proximaMesaPorMateria) {
            const dias = diasRestantes(fecha, today)
            if (dias < 0) continue
            if (dias > leadDays) continue

            const eventKey = `mesa:${materiaId}:${fecha}`
            const { data: dup } = await supabase
              .from('notification_deliveries')
              .select('id')
              .eq('user_id', pref.user_id)
              .eq('scope', 'mesa')
              .eq('event_key', eventKey)
              .eq('channel', rule.channel)
              .eq('lead_days', leadDays)
              .maybeSingle()

            if (dup) continue

            const label = NOMBRES_MATERIAS[materiaId] ?? materiaId
            const bodyText = `Mesa de «${label}»: ${formatFecha(fecha)}. Faltan ${dias} día(s).`

            let deliveredMesa = false
            if (rule.channel === 'email') {
              if (!email) continue
              const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
<h2 style="color:#1e3a5f;">FAUU Tracker — Mesa de examen</h2>
<p>Hola ${nombre || 'estudiante'},</p>
<p>${bodyText}</p>
<p><a href="${appUrl}/calendario">Abrir calendario</a></p>
<p style="color:#888;font-size:0.85em;">Recordatorios por día calendario (huso Argentina, UNNE). No reflejan la hora del examen.</p>
</body></html>`
              try {
                await supabase.auth.admin.sendRawEmail({
                  to: email,
                  subject: `Mesa próxima — ${label} — FAUU Tracker`,
                  html,
                })
                emailsSent++
                deliveredMesa = true
              } catch (sendErr) {
                console.error('sendRawEmail mesa', sendErr)
                continue
              }
            } else {
              if (!pushOk || !subs?.length) continue
              const payload = JSON.stringify({
                title: 'FAUU Tracker — Mesa',
                body: bodyText,
                url: `${appUrl}/calendario`,
              })
              for (const s of subs) {
                try {
                  await webpush.sendNotification(
                    { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                    payload
                  )
                  pushSent++
                  deliveredMesa = true
                } catch (err: unknown) {
                  const st = (err as { statusCode?: number })?.statusCode
                  if (st === 404 || st === 410) {
                    await supabase.from('push_subscriptions').delete().eq('id', s.id)
                  } else console.error('webpush mesa', err)
                }
              }
              if (!deliveredMesa) continue
            }

            if (deliveredMesa) {
              await supabase.from('notification_deliveries').insert({
                user_id: pref.user_id,
                scope: 'mesa',
                event_key: eventKey,
                channel: rule.channel,
                lead_days: leadDays,
              })
            }
          }
        }
      }
    }

    // pushVapidConfigured: false → faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY en secrets de la función
    return new Response(
      JSON.stringify({
        ok: true,
        emailsSent,
        pushSent,
        today,
        pushVapidConfigured: pushOk,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Error en check-vencimientos:', err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
