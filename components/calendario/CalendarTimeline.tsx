'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  TURNOS_2026,
  FERIADOS_2026,
  CUATRIMESTRES_2026,
  RECUPERATORIOS_2026,
} from '@/lib/data/calendario-academico'
import { Badge } from '@/components/ui/badge'

const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const TURNO_COLORS = [
  'bg-violet-500',
  'bg-indigo-500',
  'bg-blue-500',
  'bg-cyan-500',
  'bg-teal-500',
  'bg-purple-500',
  'bg-fuchsia-500',
]

function dayOfYear(iso: string): number {
  const date = new Date(iso + 'T12:00:00')
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function daysInYear(year: number): number {
  return new Date(year, 11, 31).getDate() === 31 ? 365 : 366
}

function pct(iso: string, year = 2026): number {
  return (dayOfYear(iso) / daysInYear(year)) * 100
}

function durationPct(start: string, end: string, year = 2026): number {
  const days = daysInYear(year)
  const startDay = dayOfYear(start)
  const endDay = dayOfYear(end)
  return ((endDay - startDay + 1) / days) * 100
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${parseInt(d)}/${parseInt(m)}`
}

interface TimelineRow {
  label: string
  start: string
  end: string
  color: string
  textColor?: string
  layer: number
}

interface TimelineMarker {
  date: string
  label: string
  color: string
  layer: number
}

export function CalendarTimeline() {
  const year = 2026
  const days = daysInYear(year)

  // Month column guides
  const monthGuides = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(year, i, 1)
      const doy = dayOfYear(`${year}-${String(i + 1).padStart(2, '0')}-01`)
      return {
        label: MONTH_NAMES_SHORT[i],
        pctStart: ((doy - 1) / days) * 100,
        month: i,
      }
    })
  }, [days])

  // Rows: cuatrimestres
  const rows: TimelineRow[] = useMemo(() => {
    const result: TimelineRow[] = []

    for (const c of CUATRIMESTRES_2026) {
      if (c.nombre === 'Receso Invernal') {
        result.push({
          label: 'Receso',
          start: c.inicio,
          end: c.fin,
          color: 'bg-slate-400 dark:bg-slate-600',
          textColor: 'text-slate-700 dark:text-slate-200',
          layer: 0,
        })
      } else {
        result.push({
          label: c.nombre,
          start: c.inicio,
          end: c.fin,
          color: 'bg-emerald-500 dark:bg-emerald-600',
          textColor: 'text-white',
          layer: 0,
        })
      }
    }

    for (const r of RECUPERATORIOS_2026) {
      result.push({
        label: 'Recuperatorios',
        start: r.inicio,
        end: r.fin,
        color: 'bg-amber-400 dark:bg-amber-600',
        textColor: 'text-amber-900 dark:text-amber-100',
        layer: 0,
      })
    }

    for (let i = 0; i < TURNOS_2026.length; i++) {
      const t = TURNOS_2026[i]
      result.push({
        label: `T${t.numero}`,
        start: t.fechaInicio,
        end: t.fechaFin,
        color: TURNO_COLORS[i % TURNO_COLORS.length],
        textColor: 'text-white',
        layer: 1,
      })
    }

    return result
  }, [])

  // Feriado markers
  const markers: TimelineMarker[] = useMemo(() => {
    return FERIADOS_2026.map((f) => ({
      date: f.fecha,
      label: f.nombre,
      color: f.tipo === 'feriado' ? 'bg-rose-500' : f.tipo === 'asueto' ? 'bg-orange-400' : 'bg-slate-400',
      layer: 2,
    }))
  }, [])

  const layer0rows = rows.filter((r) => r.layer === 0)
  const layer1rows = rows.filter((r) => r.layer === 1)

  return (
    <div className="space-y-6 overflow-x-auto pb-2">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-6 rounded-sm bg-emerald-500" />
          Cuatrimestre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-6 rounded-sm bg-slate-400" />
          Receso
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-6 rounded-sm bg-amber-400" />
          Recuperatorios
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-6 rounded-sm bg-violet-500" />
          Turnos de exámenes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-500" />
          Feriado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-orange-400" />
          Asueto/No laborable
        </span>
      </div>

      <div className="min-w-[600px]">
        {/* Month labels */}
        <div className="relative h-6 mb-1">
          {monthGuides.map((g) => (
            <div
              key={g.month}
              className="absolute top-0 text-[10px] text-muted-foreground"
              style={{ left: `${g.pctStart}%` }}
            >
              {g.label}
            </div>
          ))}
        </div>

        {/* Month vertical guides */}
        <div className="relative rounded-lg border bg-card overflow-hidden" style={{ minHeight: 160 }}>
          {/* Month guide lines */}
          {monthGuides.map((g) => (
            <div
              key={g.month}
              className="absolute top-0 bottom-0 w-px bg-border/50"
              style={{ left: `${g.pctStart}%` }}
            />
          ))}

          {/* Today marker */}
          {(() => {
            const today = new Date()
            if (today.getFullYear() !== year) return null
            const todayIso = today.toISOString().slice(0, 10)
            return (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-20"
                style={{ left: `${pct(todayIso, year)}%` }}
                title="Hoy"
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[9px] text-primary font-bold whitespace-nowrap">
                  hoy
                </div>
              </div>
            )
          })()}

          {/* Layer 0: cuatrimestres + recuperatorios */}
          <div className="relative h-10 border-b">
            <div className="absolute inset-y-0 left-0 flex items-center px-2 text-[10px] font-semibold text-muted-foreground whitespace-nowrap z-10 pointer-events-none">
              &nbsp;
            </div>
            {layer0rows.map((row, i) => {
              const left = pct(row.start, year)
              const width = durationPct(row.start, row.end, year)
              return (
                <div
                  key={i}
                  className={cn('absolute top-2 bottom-2 rounded flex items-center px-1 overflow-hidden group', row.color)}
                  style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
                  title={`${row.label}: ${formatDate(row.start)} – ${formatDate(row.end)}`}
                >
                  <span className={cn('text-[10px] font-semibold truncate', row.textColor)}>
                    {row.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Layer 1: turnos */}
          <div className="relative h-10 border-b">
            {layer1rows.map((row, i) => {
              const left = pct(row.start, year)
              const width = durationPct(row.start, row.end, year)
              return (
                <div
                  key={i}
                  className={cn('absolute top-2 bottom-2 rounded flex items-center px-1 overflow-hidden', row.color)}
                  style={{ left: `${left}%`, width: `${Math.max(width, 0.8)}%` }}
                  title={`${TURNOS_2026[i]?.nombre ?? row.label}: ${formatDate(row.start)} – ${formatDate(row.end)}`}
                >
                  <span className={cn('text-[10px] font-bold', row.textColor)}>{row.label}</span>
                </div>
              )
            })}
          </div>

          {/* Layer 2: feriados */}
          <div className="relative h-8">
            {markers.map((m, i) => {
              const left = pct(m.date, year)
              return (
                <div
                  key={i}
                  className={cn('absolute top-2 w-1.5 h-4 rounded-full -translate-x-1/2', m.color)}
                  style={{ left: `${left}%` }}
                  title={`${m.label} (${formatDate(m.date)})`}
                />
              )
            })}
          </div>
        </div>

        {/* Turno detail list */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TURNOS_2026.map((t, i) => (
            <div key={t.numero} className="rounded-lg border p-2 text-xs space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full', TURNO_COLORS[i % TURNO_COLORS.length])} />
                <span className="font-semibold">{t.nombre}</span>
              </div>
              <p className="text-muted-foreground pl-3.5">
                {formatDate(t.fechaInicio)}–{formatDate(t.fechaFin)}
              </p>
              <p className="text-muted-foreground/70 pl-3.5 text-[10px]">
                Inscr: {formatDate(t.inscripcionDesde)}–{formatDate(t.inscripcionHasta)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
