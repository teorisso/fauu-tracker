'use client'

import { useState } from 'react'
import { Materia, MateriaEstado } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import {
  calcularVencimientoAproximado,
  getVencimientoInfo,
  formatFechaDisplay,
} from '@/lib/logic/vencimientos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface MateriaConRegularidad {
  materia: Materia
  estado: MateriaEstado
}

interface VencimientoEditorProps {
  userId: string
  materiasConRegularidad: MateriaConRegularidad[]
}

/** Convierte de ISO (YYYY-MM-DD) a formato argentino (DD/MM/AAAA) */
function isoToArg(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

/** Convierte de formato argentino (DD/MM/AAAA) a ISO (YYYY-MM-DD) */
function argToIso(arg: string): string {
  const parts = arg.split('/')
  if (parts.length !== 3) return ''
  const [d, m, y] = parts
  if (!d || !m || !y || y.length !== 4) return ''
  const day = d.padStart(2, '0')
  const month = m.padStart(2, '0')
  const di = parseInt(day)
  const mi = parseInt(month)
  const yi = parseInt(y)
  if (di < 1 || di > 31 || mi < 1 || mi > 12 || yi < 1900 || yi > 2100) return ''
  return `${y}-${month}-${day}`
}

/** Aplica auto-formato al escribir: inserta / luego del día y del mes */
function formatDateInput(raw: string, prevDisplay: string): string {
  // Solo dígitos y barras
  raw = raw.replace(/[^\d/]/g, '').slice(0, 10)

  // Auto-slash solo cuando el usuario agrega caracteres (no cuando borra)
  const isAdding = raw.replace(/\//g, '').length > prevDisplay.replace(/\//g, '').length

  if (isAdding) {
    // Después de DD (posición 2)
    if (raw.length === 2 && !raw.includes('/')) raw += '/'
    // Después de MM (posición 5, ej: "28/02")
    else if (raw.length === 5 && (raw.match(/\//g) ?? []).length === 1) raw += '/'
  }

  return raw
}

export function VencimientoEditor({ userId, materiasConRegularidad }: VencimientoEditorProps) {
  const [vencimientos, setVencimientos] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const { materia, estado } of materiasConRegularidad) {
      if (estado.vencimiento_regularidad) {
        initial[materia.id] = estado.vencimiento_regularidad
      } else if (estado.fecha_regularidad) {
        initial[materia.id] = calcularVencimientoAproximado(estado.fecha_regularidad)
      }
    }
    return initial
  })

  // Estado de display separado para manejar el input de texto libre
  const [displayValues, setDisplayValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const { materia } of materiasConRegularidad) {
      const iso = vencimientos[materia.id]
      if (iso) init[materia.id] = isoToArg(iso)
    }
    return init
  })

  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSavedCount(null)
    const supabase = createClient()
    let count = 0

    for (const { materia } of materiasConRegularidad) {
      const vencimiento = vencimientos[materia.id]
      if (!vencimiento) continue
      try {
        await supabase
          .from('materia_estados')
          .update({ vencimiento_regularidad: vencimiento })
          .eq('user_id', userId)
          .eq('materia_id', materia.id)
        count++
      } catch (err) {
        console.error(`Error guardando vencimiento ${materia.id}:`, err)
      }
    }

    setSaving(false)
    setSavedCount(count)
  }

  function handleDisplayChange(materiaId: string, raw: string) {
    const prev = displayValues[materiaId] ?? ''
    const formatted = formatDateInput(raw, prev)
    setDisplayValues((prev) => ({ ...prev, [materiaId]: formatted }))

    // Solo actualizar ISO si la fecha es válida y completa
    const iso = argToIso(formatted)
    if (iso) {
      setVencimientos((prev) => ({ ...prev, [materiaId]: iso }))
    }
  }

  function getApproximateLabel(estado: MateriaEstado): string {
    if (!estado.fecha_regularidad) return '—'
    const approx = calcularVencimientoAproximado(estado.fecha_regularidad)
    return `Aprox. ${formatFechaDisplay(approx)}`
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Materia</th>
              <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">Regularidad</th>
              <th className="px-3 py-2 text-left font-medium">Vencimiento</th>
              <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">Estado</th>
            </tr>
          </thead>
          <tbody>
            {materiasConRegularidad.map(({ materia, estado }) => {
              const venc = vencimientos[materia.id]
              const info = venc ? getVencimientoInfo(venc) : null
              const statusColors = {
                ok: 'text-emerald-600',
                warning: 'text-yellow-600',
                danger: 'text-red-600',
                expired: 'text-gray-500',
              }

              return (
                <tr key={materia.id} className="border-t">
                  <td className="px-3 py-2 font-medium">
                    <div>
                      {materia.nombre}
                      {/* En mobile: mostrar estado debajo del nombre */}
                      {info && (
                        <span className={`block text-xs font-normal sm:hidden ${statusColors[info.estado]}`}>
                          {info.label}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">
                    {estado.fecha_regularidad
                      ? formatFechaDisplay(estado.fecha_regularidad)
                      : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-0.5">
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="DD/MM/AAAA"
                        value={displayValues[materia.id] ?? ''}
                        onChange={(e) => handleDisplayChange(materia.id, e.target.value)}
                        className="h-7 w-32 text-xs"
                        maxLength={10}
                      />
                      {!estado.vencimiento_regularidad && (
                        <span className="text-xs text-muted-foreground">
                          {getApproximateLabel(estado)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 hidden sm:table-cell">
                    {info ? (
                      <span className={`text-xs font-medium ${statusColors[info.estado]}`}>
                        {info.label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin fecha</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar vencimientos'}
        </Button>
        {savedCount !== null && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {savedCount} guardados
          </span>
        )}
        {error && (
          <span className="flex items-center gap-1 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Ingresá la fecha en formato DD/MM/AAAA. Las fechas aproximadas se calculan
        automáticamente. Para mayor precisión, consultá el vencimiento exacto en el SIU
        Guaraní (Historia Académica → expandir la regularidad).
      </p>
    </div>
  )
}
