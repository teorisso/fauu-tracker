'use client'

import { useMemo } from 'react'
import { TURNOS_2026 } from '@/lib/data/calendario-academico'
import { Clock, Calendar } from 'lucide-react'

function diasHasta(isoDate: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const target = new Date(isoDate)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

function formatFechaCorta(isoDate: string): string {
  const [, m, d] = isoDate.split('-')
  const meses = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${parseInt(d)} ${meses[parseInt(m)]}`
}

type TipoCountdown = 'en_curso' | 'inscripcion_abierta' | 'proximo'

interface CountdownInfo {
  nombre: string
  tipo: TipoCountdown
  diasMesas?: number
  diasMesasFin?: number
  diasInscripcionDesde?: number
  diasInscripcionHasta?: number
  fechaFin?: string
}

export function CountdownBanner() {
  const info = useMemo<CountdownInfo | null>(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    for (const turno of TURNOS_2026) {
      const fechaFin = new Date(turno.fechaFin)
      fechaFin.setHours(0, 0, 0, 0)
      if (fechaFin < hoy) continue

      const diasDesde = diasHasta(turno.inscripcionDesde)
      const diasHasta_ = diasHasta(turno.inscripcionHasta)
      const diasInicio = diasHasta(turno.fechaInicio)
      const diasFin = diasHasta(turno.fechaFin)

      // Mesas en curso
      if (diasInicio <= 0 && diasFin >= 0) {
        return { nombre: turno.nombre, tipo: 'en_curso', diasMesasFin: diasFin, fechaFin: turno.fechaFin }
      }

      // Inscripción abierta
      if (diasDesde <= 0 && diasHasta_ >= 0) {
        return {
          nombre: turno.nombre,
          tipo: 'inscripcion_abierta',
          diasInscripcionHasta: diasHasta_,
          diasMesas: diasInicio,
        }
      }

      // Próximo (inscripción no abierta aún)
      return {
        nombre: turno.nombre,
        tipo: 'proximo',
        diasInscripcionDesde: diasDesde,
        diasMesas: diasInicio,
      }
    }
    return null
  }, [])

  if (!info) return null

  const urgency: 'normal' | 'warning' | 'danger' = (() => {
    if (info.tipo === 'en_curso') return 'danger'
    if (info.tipo === 'inscripcion_abierta') {
      return (info.diasInscripcionHasta ?? 99) <= 2 ? 'danger' : 'warning'
    }
    return (info.diasInscripcionDesde ?? 99) <= 7 ? 'warning' : 'normal'
  })()

  const styles = {
    normal: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-300',
    warning: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
    danger: 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300',
  }

  function d(n: number) {
    return `${n} día${n !== 1 ? 's' : ''}`
  }

  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${styles[urgency]}`}>
      {info.tipo === 'en_curso' ? (
        <Calendar className="h-4 w-4 shrink-0" />
      ) : (
        <Clock className="h-4 w-4 shrink-0" />
      )}
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="font-medium">{info.nombre}</span>
        <span className="text-current/70">·</span>
        {info.tipo === 'en_curso' && (
          <span>
            Mesas en curso
            {info.fechaFin && ` · Terminan el ${formatFechaCorta(info.fechaFin)}`}
          </span>
        )}
        {info.tipo === 'inscripcion_abierta' && (
          <span>
            Inscripción abierta
            {(info.diasInscripcionHasta ?? 0) > 0
              ? ` · Cierra en ${d(info.diasInscripcionHasta!)}`
              : ' · Cierra hoy'}
            {info.diasMesas !== undefined && ` · Mesas en ${d(info.diasMesas)}`}
          </span>
        )}
        {info.tipo === 'proximo' && (
          <span>
            {(info.diasInscripcionDesde ?? 0) > 0
              ? `Inscripción en ${d(info.diasInscripcionDesde!)}`
              : 'Inscripción hoy'}
            {info.diasMesas !== undefined && ` · Mesas en ${d(info.diasMesas)}`}
          </span>
        )}
      </div>
    </div>
  )
}
