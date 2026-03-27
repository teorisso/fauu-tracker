'use client'

import { useState, useEffect } from 'react'
import { CalendarioMesas, type MesaAnotadaInfo } from './CalendarioMesas'
import { CalendarMonthGrid } from './CalendarMonthGrid'
import { CalendarTimeline } from './CalendarTimeline'
import { CalendarViewToggle, type CalendarView } from './CalendarViewToggle'
import { CountdownBanner } from '@/components/CountdownBanner'
import { MateriaEstado } from '@/lib/types'
import {
  TURNOS_2026,
  MESAS_ARQ,
  getMesasData,
  type TurnoExamen,
  type MesaExamen,
} from '@/lib/data/calendario-academico'
import { Settings2 } from 'lucide-react'
import NextLink from 'next/link'
import { Button } from '@/components/ui/button'

const ANIO = 2026

interface CalendarioPageClientProps {
  userId: string
  estados: Record<string, MateriaEstado>
  mesasAnotadasInit: Record<string, MesaAnotadaInfo>
}

export function CalendarioPageClient({
  userId,
  estados,
  mesasAnotadasInit,
}: CalendarioPageClientProps) {
  const [view, setView] = useState<CalendarView>('lista')
  const [turnos, setTurnos] = useState<TurnoExamen[]>(TURNOS_2026)
  const [mesas, setMesas] = useState<MesaExamen[]>(MESAS_ARQ)

  useEffect(() => {
    getMesasData(ANIO).then(({ turnos: t, mesas: m, source }) => {
      if (source === 'scraper') {
        setTurnos(t)
        setMesas(m)
      }
    })
  }, [])

  // Simple estado map for CalendarMonthGrid (only needs estado + vencimiento)
  const estadoMap: Record<string, { estado: string; vencimiento_regularidad?: string }> = {}
  for (const [id, e] of Object.entries(estados)) {
    estadoMap[id] = { estado: e.estado, vencimiento_regularidad: e.vencimiento_regularidad }
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Calendario de Mesas {ANIO}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mesas de examen de Arquitectura Plan 2018 — FAU UNNE.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CalendarViewToggle view={view} onChange={setView} />
          <NextLink href="/calendario/gestionar">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings2 className="h-3.5 w-3.5" />
              Años futuros
            </Button>
          </NextLink>
        </div>
      </div>

      {view !== 'timeline' && <CountdownBanner />}

      <div className="mt-4">
        {view === 'lista' && (
          <CalendarioMesas
            userId={userId}
            estados={estados}
            mesasAnotadasInit={mesasAnotadasInit}
            turnos={turnos}
            mesas={mesas}
          />
        )}

        {view === 'mes' && (
          <CalendarMonthGrid
            estados={estadoMap}
            mesasAnotadas={mesasAnotadasInit}
          />
        )}

        {view === 'timeline' && <CalendarTimeline />}
      </div>

      {view === 'lista' && (
        <div className="mt-8 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          <p className="font-medium">Leyenda</p>
          <ul className="mt-2 space-y-1">
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              Regular: tenés regularidad vigente y correlatividades completas
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              Libre: podés rendir aunque no tengas regularidad vigente
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-muted-foreground/40" />
              No podés rendir: correlatividades incompletas o materia ya aprobada
            </li>
          </ul>
          <p className="mt-3 text-xs">
            Las fechas son según el Calendario Académico 2026 (RES-2025-542-CD-ARQ#UNNE).
          </p>
        </div>
      )}
    </div>
  )
}
