'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, ExternalLink, CheckCircle2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  TURNOS_2026,
  FERIADOS_2026,
  CUATRIMESTRES_2026,
  RECUPERATORIOS_2026,
  MESAS_ARQ,
  calcularFechaMesa,
} from '@/lib/data/calendario-academico'
import { MATERIAS } from '@/lib/data/materias'
import type { MesaAnotadaInfo } from './CalendarioMesas'

interface DayEvent {
  tipo: 'mesa' | 'feriado' | 'cuatrimestre_inicio' | 'cuatrimestre_fin' | 'receso' | 'turno' | 'recuperatorio'
  label: string
  color: string
  materiaId?: string
  turnoNumero?: number
  fecha?: string
  hora?: string
  aula?: string
  condicion?: 'regular' | 'libre'
  anotado?: boolean
}

interface CalendarMonthGridProps {
  estados: Record<string, { estado: string; vencimiento_regularidad?: string }>
  mesasAnotadas: Record<string, MesaAnotadaInfo>
  onToggleAnotado?: (
    materiaId: string,
    fecha: string,
    turnoNumero: number,
    condicion: 'regular' | 'libre'
  ) => void
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DAY_NAMES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

function buildDayIndex(): Map<string, DayEvent[]> {
  const idx = new Map<string, DayEvent[]>()

  function addEvent(date: string, event: DayEvent) {
    if (!idx.has(date)) idx.set(date, [])
    idx.get(date)!.push(event)
  }

  // Feriados
  for (const f of FERIADOS_2026) {
    addEvent(f.fecha, {
      tipo: 'feriado',
      label: f.nombre,
      color: 'text-rose-600 dark:text-rose-400',
    })
  }

  // Cuatrimestres
  for (const c of CUATRIMESTRES_2026) {
    if (c.nombre === 'Receso Invernal') {
      const d = new Date(c.inicio + 'T12:00:00')
      const fin = new Date(c.fin + 'T12:00:00')
      while (d <= fin) {
        addEvent(d.toISOString().slice(0, 10), {
          tipo: 'receso',
          label: 'Receso Invernal',
          color: 'text-slate-500',
        })
        d.setDate(d.getDate() + 1)
      }
    } else {
      addEvent(c.inicio, {
        tipo: 'cuatrimestre_inicio',
        label: `Inicio ${c.nombre}`,
        color: 'text-emerald-600 dark:text-emerald-400',
      })
      addEvent(c.fin, {
        tipo: 'cuatrimestre_fin',
        label: `Fin ${c.nombre}`,
        color: 'text-amber-600 dark:text-amber-400',
      })
    }
  }

  // Recuperatorios
  for (const r of RECUPERATORIOS_2026) {
    const d = new Date(r.inicio + 'T12:00:00')
    const fin = new Date(r.fin + 'T12:00:00')
    while (d <= fin) {
      addEvent(d.toISOString().slice(0, 10), {
        tipo: 'recuperatorio',
        label: r.nombre,
        color: 'text-amber-600 dark:text-amber-400',
      })
      d.setDate(d.getDate() + 1)
    }
  }

  // Turnos (períodos completos)
  for (const t of TURNOS_2026) {
    const d = new Date(t.fechaInicio + 'T12:00:00')
    const fin = new Date(t.fechaFin + 'T12:00:00')
    while (d <= fin) {
      addEvent(d.toISOString().slice(0, 10), {
        tipo: 'turno',
        label: t.nombre,
        turnoNumero: t.numero,
        color: 'text-violet-600 dark:text-violet-400',
      })
      d.setDate(d.getDate() + 1)
    }
  }

  return idx
}

const DAY_INDEX = buildDayIndex()

function getMesasForDay(
  date: string,
  estados: Record<string, { estado: string; vencimiento_regularidad?: string }>,
  mesasAnotadas: Record<string, MesaAnotadaInfo>
): DayEvent[] {
  const events: DayEvent[] = []
  for (const turno of TURNOS_2026) {
    for (const mesa of MESAS_ARQ) {
      if (!mesa.materiaId) continue
      const fechaMesa = calcularFechaMesa(turno, mesa.diaSemana)
      if (fechaMesa !== date) continue

      const estado = estados[mesa.materiaId]
      if (estado?.estado === 'final_aprobado' || estado?.estado === 'promocionada') continue

      let condicion: 'regular' | 'libre' = 'libre'
      if (estado?.estado === 'regular_vigente') {
        if (
          estado.vencimiento_regularidad &&
          estado.vencimiento_regularidad < date
        ) {
          condicion = 'libre'
        } else {
          condicion = 'regular'
        }
      }

      const key = `${mesa.materiaId}-${date}`
      const anotado = mesasAnotadas[key]?.anotado ?? false
      const materia = MATERIAS.find((m) => m.id === mesa.materiaId)

      events.push({
        tipo: 'mesa',
        label: materia?.nombre ?? mesa.nombreOficial,
        color: condicion === 'regular'
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-amber-600 dark:text-amber-400',
        materiaId: mesa.materiaId,
        turnoNumero: turno.numero,
        fecha: date,
        hora: mesa.hora,
        aula: mesa.aula,
        condicion,
        anotado,
      })
    }
  }
  return events
}

function buildGCalUrl(event: DayEvent): string {
  if (!event.fecha) return '#'
  const dateStr = event.fecha.replace(/-/g, '')
  // All-day event format: YYYYMMDD/YYYYMMDD (next day for end)
  const endDate = new Date(event.fecha + 'T12:00:00')
  endDate.setDate(endDate.getDate() + 1)
  const endStr = endDate.toISOString().slice(0, 10).replace(/-/g, '')
  const title = encodeURIComponent(`Examen: ${event.label}`)
  const details = encodeURIComponent(
    `Turno ${event.turnoNumero} · ${event.hora ?? ''}${event.aula ? ` · Aula: ${event.aula}` : ''}`
  )
  const location = encodeURIComponent(event.aula ?? 'FAU-UNNE')
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${endStr}&details=${details}&location=${location}`
}

export function CalendarMonthGrid({
  estados,
  mesasAnotadas,
  onToggleAnotado,
}: CalendarMonthGridProps) {
  const today = new Date()
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(() => {
    if (today.getFullYear() === 2026) return today.getMonth()
    return 0
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7 // Monday=0

  const cells = useMemo(() => {
    const result: Array<{ date: string | null; day: number | null }> = []
    for (let i = 0; i < firstDayOfWeek; i++) result.push({ date: null, day: null })
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      result.push({ date: dateStr, day: d })
    }
    return result
  }, [year, month, daysInMonth, firstDayOfWeek])

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return []
    const base = DAY_INDEX.get(selectedDate) ?? []
    const mesas = getMesasForDay(selectedDate, estados, mesasAnotadas)
    return [...mesas, ...base]
  }, [selectedDate, estados, mesasAnotadas])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function getDayMeta(date: string) {
    const baseEvents = DAY_INDEX.get(date) ?? []
    const mesas = getMesasForDay(date, estados, mesasAnotadas)
    const isFeriado = baseEvents.some((e) => e.tipo === 'feriado')
    const isReceso = baseEvents.some((e) => e.tipo === 'receso')
    const hasTurno = baseEvents.some((e) => e.tipo === 'turno')
    const hasCuatrimestre = baseEvents.some(
      (e) => e.tipo === 'cuatrimestre_inicio' || e.tipo === 'cuatrimestre_fin'
    )
    const mesasRegular = mesas.filter((m) => m.condicion === 'regular')
    const mesasLibre = mesas.filter((m) => m.condicion === 'libre')
    const isToday =
      date === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    return { isFeriado, isReceso, hasTurno, hasCuatrimestre, mesasRegular, mesasLibre, isToday, allMesas: mesas }
  }

  return (
    <div className="space-y-4">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-base font-semibold">
          {MONTH_NAMES[month]} {year}
        </h3>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid */}
      <div className="rounded-lg border overflow-hidden">
        {/* Day names */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            if (!cell.date || !cell.day) {
              return <div key={`empty-${i}`} className="aspect-square border-b border-r" />
            }

            const meta = getDayMeta(cell.date)
            const isSelected = selectedDate === cell.date

            return (
              <button
                key={cell.date}
                onClick={() => setSelectedDate(isSelected ? null : cell.date)}
                className={cn(
                  'aspect-square border-b border-r p-1 text-left transition-colors relative group',
                  'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  meta.isReceso && 'bg-slate-100 dark:bg-slate-800/50',
                  meta.hasTurno && !meta.isReceso && 'bg-violet-50 dark:bg-violet-950/20',
                  isSelected && 'ring-2 ring-inset ring-primary z-10',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                    meta.isToday && 'bg-primary text-primary-foreground',
                    meta.isFeriado && !meta.isToday && 'text-rose-600 dark:text-rose-400 font-semibold',
                    meta.hasCuatrimestre && !meta.isToday && !meta.isFeriado && 'ring-2 ring-emerald-500',
                  )}
                >
                  {cell.day}
                </span>

                {/* Dots */}
                <div className="absolute bottom-1 left-1 flex gap-0.5 flex-wrap max-w-full">
                  {meta.mesasRegular.length > 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                  {meta.mesasLibre.length > 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  )}
                  {meta.isFeriado && (
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selectedDate && selectedEvents.length > 0 && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              {parseInt(selectedDate.slice(8))} de {MONTH_NAMES[parseInt(selectedDate.slice(5, 7)) - 1]}
            </h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setSelectedDate(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-2">
            {selectedEvents.map((event, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-md border p-3 text-sm',
                  event.tipo === 'mesa' && event.condicion === 'regular' && 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20',
                  event.tipo === 'mesa' && event.condicion === 'libre' && 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20',
                  event.tipo === 'feriado' && 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/20',
                  event.tipo === 'receso' && 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/30',
                  event.tipo === 'turno' && 'border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/20',
                  event.tipo === 'cuatrimestre_inicio' && 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20',
                  event.tipo === 'cuatrimestre_fin' && 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20',
                  event.tipo === 'recuperatorio' && 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight">{event.label}</p>
                    {event.tipo === 'mesa' && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {event.hora}
                        {event.aula && ` · ${event.aula}`}
                        {event.condicion === 'libre' && (
                          <span className="ml-1 text-amber-600 dark:text-amber-400">· Como libre</span>
                        )}
                      </p>
                    )}
                    {event.tipo === 'feriado' && (
                      <Badge variant="outline" className="mt-1 text-xs border-rose-300 text-rose-600 dark:text-rose-400">
                        Feriado
                      </Badge>
                    )}
                  </div>

                  {event.tipo === 'mesa' && event.materiaId && event.fecha && event.turnoNumero && (
                    <div className="flex gap-1 shrink-0">
                      {onToggleAnotado && (
                        <button
                          onClick={() =>
                            onToggleAnotado(
                              event.materiaId!,
                              event.fecha!,
                              event.turnoNumero!,
                              event.condicion!
                            )
                          }
                          className={cn(
                            'rounded border px-2 py-1 text-xs transition-colors',
                            event.anotado
                              ? event.condicion === 'libre'
                                ? 'border-amber-500 bg-amber-500 text-white'
                                : 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          {event.anotado ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Anotado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Anotar
                            </span>
                          )}
                        </button>
                      )}
                      <a
                        href={buildGCalUrl(event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:border-primary/50 hover:text-primary transition-colors"
                        title="Agregar a Google Calendar"
                      >
                        <ExternalLink className="h-3 w-3" />
                        GCal
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDate && selectedEvents.length === 0 && (
        <div className="rounded-lg border bg-muted/30 p-3 text-center text-sm text-muted-foreground">
          Sin eventos para este día.
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Regular
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Libre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          Feriado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-4 w-4 rounded bg-violet-50 dark:bg-violet-950/30 border border-violet-200" />
          Turno de exámenes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-4 w-4 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200" />
          Receso
        </span>
      </div>
    </div>
  )
}
