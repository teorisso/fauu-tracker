'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  formatPushSubscribeError,
  getOrRegisterServiceWorker,
  parseVapidApplicationServerKey,
} from '@/lib/push-client'
import { type AlertRule, DEFAULT_ALERT_RULES } from '@/lib/notifications'
import { Save, Bell, X, Plus } from 'lucide-react'

interface NotificationPrefsProps {
  userId: string
  initialAlertRules: AlertRule[]
  initialPushSubscriptionCount: number
}

export function NotificationPrefs({
  userId,
  initialAlertRules,
  initialPushSubscriptionCount,
}: NotificationPrefsProps) {
  const [rules, setRules] = useState<AlertRule[]>(
    initialAlertRules.length > 0 ? initialAlertRules : [...DEFAULT_ALERT_RULES]
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pushCount, setPushCount] = useState(initialPushSubscriptionCount)
  const [pushBusy, setPushBusy] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)
  /** Clave pública cargada desde GET /api/vapid-public (runtime; evita fallos de build con NEXT_PUBLIC_*). */
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null)
  const [vapidKeyLoading, setVapidKeyLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/vapid-public', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { publicKey: string | null }) => {
        if (!cancelled) {
          setVapidPublicKey(d.publicKey ?? null)
          setVapidKeyLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVapidPublicKey(null)
          setVapidKeyLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  function updateRule(index: number, patch: Partial<AlertRule>) {
    setRules((prev) => {
      const next = [...prev]
      const cur = next[index]
      if (!cur) return prev
      next[index] = { ...cur, ...patch }
      return next
    })
  }

  function removeRule(index: number) {
    setRules((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  function addRule() {
    setRules((prev) => [
      ...prev,
      { scope: 'regularidad', channel: 'email', amount: 30, unit: 'days' },
    ])
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const supabase = createClient()
    const { error } = await supabase.from('notification_preferences').upsert(
      {
        user_id: userId,
        alert_rules: rules,
      },
      { onConflict: 'user_id' }
    )
    setSaving(false)
    if (error) {
      console.error(error)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function enablePush() {
    setPushError(null)
    const key =
      vapidPublicKey ??
      (await fetch('/api/vapid-public', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d: { publicKey: string | null }) => d.publicKey ?? null))
    if (!key) {
      setPushError(
        'Falta la clave pública VAPID. En Vercel agregá la variable VAPID_PUBLIC_KEY (recomendado) o NEXT_PUBLIC_VAPID_PUBLIC_KEY con la Public Key en una sola línea, sin comillas, y volvé a desplegar.'
      )
      return
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      setPushError('Las notificaciones están bloqueadas en el navegador.')
      return
    }
    setPushBusy(true)
    try {
      const perm =
        typeof Notification !== 'undefined' ? await Notification.requestPermission() : 'denied'
      if (perm !== 'granted') {
        setPushError('Permiso de notificaciones no concedido.')
        setPushBusy(false)
        return
      }
      const reg = await getOrRegisterServiceWorker()
      if (!reg) {
        setPushError('Tu navegador no soporta service workers.')
        setPushBusy(false)
        return
      }
      await navigator.serviceWorker.ready

      const parsed = parseVapidApplicationServerKey(key)
      if (!parsed.ok) {
        setPushError(parsed.error)
        setPushBusy(false)
        return
      }

      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        await existing.unsubscribe()
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: parsed.key as BufferSource,
      })
      const j = sub.toJSON()
      if (!j.endpoint || !j.keys?.p256dh || !j.keys?.auth) {
        setPushError('No se pudo obtener la suscripción.')
        setPushBusy(false)
        return
      }
      const supabase = createClient()
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: userId,
          endpoint: j.endpoint,
          p256dh: j.keys.p256dh,
          auth: j.keys.auth,
        },
        { onConflict: 'endpoint' }
      )
      if (error) {
        setPushError(error.message)
        setPushBusy(false)
        return
      }
      const { count } = await supabase
        .from('push_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      setPushCount(count ?? 1)
    } catch (e) {
      setPushError(formatPushSubscribeError(e))
    }
    setPushBusy(false)
  }

  async function disablePush() {
    setPushBusy(true)
    setPushError(null)
    try {
      const supabase = createClient()
      await supabase.from('push_subscriptions').delete().eq('user_id', userId)
      const reg = await navigator.serviceWorker?.getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
      setPushCount(0)
    } catch (e) {
      setPushError(e instanceof Error ? e.message : 'Error al desactivar')
    }
    setPushBusy(false)
  }

  const hasPushRules = rules.some((r) => r.channel === 'push')
  const pushConfigured = pushCount > 0

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Los recordatorios se calculan por <strong>día calendario</strong> (huso Argentina, UNNE —
        Resistencia), no por la hora del examen ni del vencimiento en el SIU.
      </p>

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <div
            key={index}
            className="flex flex-wrap items-center gap-2 border border-border rounded-md p-3 bg-muted/30"
          >
            <Bell className="h-4 w-4 shrink-0 text-muted-foreground hidden sm:block" />
            <Select
              value={rule.scope}
              onValueChange={(v) =>
                updateRule(index, { scope: v === 'mesa' ? 'mesa' : 'regularidad' })
              }
            >
              <SelectTrigger className="w-[200px] max-w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regularidad">Vencimiento de regularidad</SelectItem>
                <SelectItem value="mesa">Próxima mesa anotada</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={rule.channel}
              onValueChange={(v) => updateRule(index, { channel: v === 'push' ? 'push' : 'email' })}
            >
              <SelectTrigger className="w-[180px] max-w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Correo electrónico</SelectItem>
                <SelectItem value="push">Notificación en el navegador</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Label className="sr-only">Anticipación</Label>
              <Input
                type="number"
                min={1}
                max={365}
                className="w-20"
                value={rule.amount}
                onChange={(e) =>
                  updateRule(index, { amount: Math.max(1, parseInt(e.target.value, 10) || 1) })
                }
              />
              <Select
                value={rule.unit}
                onValueChange={(v) => updateRule(index, { unit: v === 'weeks' ? 'weeks' : 'days' })}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">días</SelectItem>
                  <SelectItem value="weeks">semanas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <span className="text-xs text-muted-foreground hidden md:inline">antes</span>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => removeRule(index)}
              disabled={rules.length <= 1}
              aria-label="Quitar alerta"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <button
          type="button"
          onClick={addRule}
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Agregar notificación
        </button>
      </div>

      {hasPushRules && !pushConfigured && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Tenés reglas con notificación en el navegador: activá la suscripción abajo para recibirlas.
        </p>
      )}

      <div className="space-y-2 rounded-md border border-border p-4">
        <h3 className="text-sm font-medium">Notificaciones en el navegador (push)</h3>
        <p className="text-xs text-muted-foreground">
          Requiere HTTPS en producción. En local, solo funciona en localhost con permiso del
          navegador.
        </p>
        {pushError && <p className="text-sm text-destructive">{pushError}</p>}
        <div className="flex flex-wrap gap-2 items-center">
          {pushConfigured ? (
            <>
              <span className="text-sm text-muted-foreground">Suscripción activa.</span>
              <Button type="button" variant="outline" size="sm" onClick={disablePush} disabled={pushBusy}>
                {pushBusy ? '…' : 'Desactivar push'}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={enablePush}
              disabled={pushBusy || vapidKeyLoading || !vapidPublicKey}
            >
              {pushBusy ? 'Activando…' : 'Activar notificaciones en el navegador'}
            </Button>
          )}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
        <Save className="h-4 w-4" />
        {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar preferencias'}
      </Button>
    </div>
  )
}
