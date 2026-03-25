'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Save, Bell, BellOff } from 'lucide-react'

const OPCIONES_DIAS = [30, 60, 90, 120, 180]

interface NotificationPrefsProps {
  userId: string
  initialEmailEnabled: boolean
  initialDiasAnticipacion: number[]
}

export function NotificationPrefs({
  userId,
  initialEmailEnabled,
  initialDiasAnticipacion,
}: NotificationPrefsProps) {
  const [emailEnabled, setEmailEnabled] = useState(initialEmailEnabled)
  const [diasAnticipacion, setDiasAnticipacion] = useState<number[]>(
    initialDiasAnticipacion.length > 0 ? initialDiasAnticipacion : [60]
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggleDias(dias: number) {
    setDiasAnticipacion((prev) => {
      if (prev.includes(dias)) {
        // No permitir dejar el array vacío
        if (prev.length === 1) return prev
        return prev.filter((d) => d !== dias).sort((a, b) => a - b)
      }
      return [...prev, dias].sort((a, b) => a - b)
    })
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const supabase = createClient()
    await supabase.from('notification_preferences').upsert(
      {
        user_id: userId,
        email_vencimientos: emailEnabled,
        dias_anticipacion: diasAnticipacion,
      },
      { onConflict: 'user_id' }
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Switch
          id="email-enabled"
          checked={emailEnabled}
          onCheckedChange={setEmailEnabled}
        />
        <Label htmlFor="email-enabled" className="flex cursor-pointer items-center gap-2 text-sm">
          {emailEnabled ? (
            <Bell className="h-4 w-4 text-primary" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
          {emailEnabled
            ? 'Recibir emails de alerta de vencimiento'
            : 'Emails de alerta desactivados'}
        </Label>
      </div>

      {emailEnabled && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Avisar con cuántos días de anticipación{' '}
            <span className="text-xs">(podés elegir más de uno):</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {OPCIONES_DIAS.map((dias) => {
              const activo = diasAnticipacion.includes(dias)
              return (
                <button
                  key={dias}
                  onClick={() => toggleDias(dias)}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    activo
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {dias} días
                </button>
              )
            })}
          </div>
          {diasAnticipacion.length > 1 && (
            <p className="text-xs text-muted-foreground">
              Recibirás un email separado en cada umbral seleccionado.
            </p>
          )}
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
        <Save className="h-4 w-4" />
        {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar preferencias'}
      </Button>
    </div>
  )
}
