'use client'

import { useMemo } from 'react'
import { MateriaEstado } from '@/lib/types'
import Link from 'next/link'
import { Upload } from 'lucide-react'

interface HeatmapActividadProps {
  estados: Record<string, MateriaEstado>
  compacto?: boolean
}

interface MesEvento {
  mes: number // 0-11
  anio: number
  label: string
  aprobaciones: number
  regularidades: number
  total: number
}

function parseFecha(str: string): Date | null {
  const d = new Date(str + 'T00:00:00')
  return isNaN(d.getTime()) ? null : d
}

const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

/** Recolecta eventos agrupados por mes */
function recolectarEventosMensuales(estados: Record<string, MateriaEstado>): {
  meses: MesEvento[]
  usaFallback: boolean
} {
  const eventosReales: { fecha: Date; tipo: 'aprobacion' | 'regularidad' }[] = []
  const eventosFallback: { fecha: Date; tipo: 'aprobacion' | 'regularidad' }[] = []

  for (const estado of Object.values(estados)) {
    if (estado.fecha_aprobacion) {
      const d = parseFecha(estado.fecha_aprobacion)
      if (d) eventosReales.push({ fecha: d, tipo: 'aprobacion' })
    }
    if (estado.fecha_regularidad) {
      const d = parseFecha(estado.fecha_regularidad)
      if (d) eventosReales.push({ fecha: d, tipo: 'regularidad' })
    }

    if (
      estado.anio_cursado &&
      (estado.estado === 'final_aprobado' || estado.estado === 'promocionada')
    ) {
      const mes = estado.cuatrimestre === 2 ? 10 : 5
      eventosFallback.push({ fecha: new Date(estado.anio_cursado, mes, 15), tipo: 'aprobacion' })
    } else if (
      estado.anio_cursado &&
      (estado.estado === 'regular_vigente' || estado.estado === 'regular_vencida')
    ) {
      const mes = estado.cuatrimestre === 2 ? 10 : 5
      eventosFallback.push({ fecha: new Date(estado.anio_cursado, mes, 15), tipo: 'regularidad' })
    }
  }

  const fuente = eventosReales.length >= 3 ? eventosReales : eventosFallback
  const usaFallback = eventosReales.length < 3 && eventosFallback.length > 0

  if (fuente.length === 0) return { meses: [], usaFallback: false }

  // Agrupar por mes (últimos 12 meses)
  const now = new Date()
  const meses: MesEvento[] = []

  for (let i = 11; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const mes = m.getMonth()
    const anio = m.getFullYear()

    let aprobaciones = 0
    let regularidades = 0
    for (const ev of fuente) {
      if (ev.fecha.getMonth() === mes && ev.fecha.getFullYear() === anio) {
        if (ev.tipo === 'aprobacion') aprobaciones++
        else regularidades++
      }
    }

    meses.push({
      mes,
      anio,
      label: MONTH_SHORT[mes],
      aprobaciones,
      regularidades,
      total: aprobaciones + regularidades,
    })
  }

  return { meses, usaFallback }
}

export function HeatmapActividad({ estados }: HeatmapActividadProps) {
  const { meses, usaFallback } = useMemo(() => recolectarEventosMensuales(estados), [estados])

  const hasData = meses.some((m) => m.total > 0)
  const maxTotal = Math.max(...meses.map((m) => m.total), 1)
  const totalEventos = meses.reduce((acc, m) => acc + m.total, 0)

  if (!hasData) {
    return (
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Actividad</span>
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Importá tu historial desde el SIU Guaraní para ver tu actividad académica.
          </p>
          <Link
            href="/perfil"
            className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--estado-final-aprobado-bg))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--estado-final-aprobado-fg))] hover:opacity-90 transition-colors"
          >
            <Upload className="h-3 w-3" />
            Importar
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Actividad {usaFallback ? '(aprox.)' : ''}
        </span>
        <span className="text-xs text-muted-foreground">
          {totalEventos} evento{totalEventos !== 1 ? 's' : ''} · 12 meses
        </span>
      </div>

      {/* Barras mensuales */}
      <div className="flex items-end gap-1 h-20 rounded-lg border bg-card p-3 pb-6 relative">
        {meses.map((m, i) => {
          const height = maxTotal > 0 ? (m.total / maxTotal) * 100 : 0
          const hasAprobaciones = m.aprobaciones > 0
          const hasRegularidades = m.regularidades > 0

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5 relative group">
              {/* Tooltip */}
              {m.total > 0 && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[10px] text-background shadow">
                  {m.aprobaciones > 0 && `${m.aprobaciones} aprob.`}
                  {m.aprobaciones > 0 && m.regularidades > 0 && ' · '}
                  {m.regularidades > 0 && `${m.regularidades} reg.`}
                </div>
              )}

              {/* Barra */}
              <div
                className="w-full rounded-sm transition-all duration-300"
                style={{
                  height: `${Math.max(height, m.total > 0 ? 8 : 0)}%`,
                  backgroundColor: hasAprobaciones
                    ? 'hsl(var(--estado-final-aprobado-bg))'
                    : hasRegularidades
                    ? 'hsl(var(--estado-regular-vigente-bg))'
                    : 'hsl(var(--estado-sin-cursar-bg))',
                  minHeight: m.total > 0 ? '4px' : '2px',
                  opacity: m.total > 0 ? 1 : 0.3,
                }}
              />

              {/* Label mes */}
              <span className="absolute -bottom-4 text-[9px] text-muted-foreground">
                {m.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-[hsl(var(--estado-final-aprobado-bg))]" />
          Aprobaciones
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-[hsl(var(--estado-regular-vigente-bg))]" />
          Regularidades
        </div>
      </div>
    </div>
  )
}
