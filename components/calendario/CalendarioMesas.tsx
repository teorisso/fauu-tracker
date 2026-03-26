'use client'

import { useState } from 'react'
import { MateriaEstado } from '@/lib/types'
import { MATERIAS } from '@/lib/data/materias'
import {
  TURNOS_2026,
  MESAS_ARQ,
  calcularFechaMesa,
} from '@/lib/data/calendario-academico'
import { validarCorrelatividades } from '@/lib/logic/correlatividades'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, AlertTriangle, Calendar, ExternalLink, Download } from 'lucide-react'
import { buildGCalUrl, downloadICS, generateICS } from '@/lib/utils/ics-generator'

interface MesaConFecha {
  materiaId: string
  nombreOficial: string
  aula?: string
  fecha: string
  hora: string
  diaSemana: string
}

export interface MesaAnotadaInfo {
  anotado: boolean
  condicion: 'regular' | 'libre'
}

interface CalendarioMesasProps {
  userId: string
  estados: Record<string, MateriaEstado>
  mesasAnotadasInit: Record<string, MesaAnotadaInfo>
}

interface ResultadoRendir {
  puede: boolean
  condicion?: 'regular' | 'libre'
  razon?: string
  /** Fecha ISO del vencimiento si vence antes de la mesa (por eso pasa a libre) */
  vencimientoAntesMesa?: string
}

/**
 * Determina si el alumno puede rendir una materia en una mesa concreta.
 * @param fechaMesa  Fecha de la mesa en formato YYYY-MM-DD — se usa para proyectar
 *                   si la regularidad habrá vencido para ese momento.
 */
function puedeRendir(
  materiaId: string,
  estados: Record<string, MateriaEstado>,
  fechaMesa: string
): ResultadoRendir {
  const e = estados[materiaId]

  if (e?.estado === 'final_aprobado' || e?.estado === 'promocionada') {
    return { puede: false, razon: 'Ya aprobada' }
  }

  // Correlatividades aplican tanto para regular como para libre
  const estadoMap: Record<string, import('@/lib/types').Estado> = {}
  for (const [id, est] of Object.entries(estados)) {
    estadoMap[id] = est.estado
  }
  const { cumple } = validarCorrelatividades(materiaId, estadoMap)
  if (!cumple) {
    return { puede: false, razon: 'Correlatividades incompletas' }
  }

  if (e?.estado === 'regular_vigente') {
    // Proyectar: ¿el vencimiento ocurre antes de la fecha de la mesa?
    if (e.vencimiento_regularidad && e.vencimiento_regularidad < fechaMesa) {
      return {
        puede: true,
        condicion: 'libre',
        vencimientoAntesMesa: e.vencimiento_regularidad,
      }
    }
    return { puede: true, condicion: 'regular' }
  }

  // Sin regularidad vigente → libre
  return { puede: true, condicion: 'libre' }
}

/** DD/MM/AAAA */
function formatFechaArg(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** "21 Oct" */
function formatFechaCorta(isoDate: string): string {
  const [, m, d] = isoDate.split('-')
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${parseInt(d)} ${meses[parseInt(m) - 1]}`
}

function getMesasBadgeClass(condicion?: 'regular' | 'libre'): string {
  if (condicion === 'regular') return 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20'
  if (condicion === 'libre') return 'border-amber-300 bg-amber-50 dark:bg-amber-950/20'
  return 'border-border bg-muted/50 opacity-60'
}

export function CalendarioMesas({ userId, estados, mesasAnotadasInit }: CalendarioMesasProps) {
  const [mesasAnotadas, setMesasAnotadas] = useState<Record<string, MesaAnotadaInfo>>(mesasAnotadasInit)
  const [selectedTurno, setSelectedTurno] = useState<number>(
    TURNOS_2026.find((t) => new Date(t.fechaFin) >= new Date())?.numero ?? TURNOS_2026[0].numero
  )

  const turno = TURNOS_2026.find((t) => t.numero === selectedTurno)!

  const mesasDelTurno: MesaConFecha[] = MESAS_ARQ.filter((m) => m.materiaId).flatMap((mesa) => {
    const fecha = calcularFechaMesa(turno, mesa.diaSemana)
    if (!fecha) return []
    return [{
      materiaId: mesa.materiaId!,
      nombreOficial: mesa.nombreOficial,
      aula: mesa.aula,
      fecha,
      hora: mesa.hora,
      diaSemana: mesa.diaSemana,
    }]
  })
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))

  const seenMaterias = new Set<string>()
  const mesasUnicas = mesasDelTurno.filter((m) => {
    if (seenMaterias.has(m.materiaId)) return false
    seenMaterias.add(m.materiaId)
    return true
  })

  // Evaluar cada mesa con la fecha concreta de la mesa
  const resultados = mesasUnicas.map((m) => ({
    mesa: m,
    resultado: puedeRendir(m.materiaId, estados, m.fecha),
  }))

  const mesasRegular = resultados.filter((r) => r.resultado.condicion === 'regular')
  const mesasLibre = resultados.filter((r) => r.resultado.condicion === 'libre')
  const noRendibles = resultados.filter((r) => !r.resultado.puede)

  async function toggleAnotado(
    materiaId: string,
    fecha: string,
    turnoNumero: number,
    condicion: 'regular' | 'libre'
  ) {
    const key = `${materiaId}-${fecha}`
    const nuevoAnotado = !(mesasAnotadas[key]?.anotado ?? false)

    setMesasAnotadas((prev) => ({
      ...prev,
      [key]: { anotado: nuevoAnotado, condicion },
    }))

    const supabase = createClient()
    if (nuevoAnotado) {
      await supabase.from('mesas_usuario').upsert(
        { user_id: userId, materia_id: materiaId, fecha, turno_numero: turnoNumero, anotado: true, condicion },
        { onConflict: 'user_id,materia_id,fecha' }
      )
    } else {
      await supabase
        .from('mesas_usuario')
        .update({ anotado: false })
        .eq('user_id', userId)
        .eq('materia_id', materiaId)
        .eq('fecha', fecha)
    }
  }

  function MesaCard({
    mesa,
    condicion,
    razon,
    vencimientoAntesMesa,
  }: {
    mesa: MesaConFecha
    condicion?: 'regular' | 'libre'
    razon?: string
    vencimientoAntesMesa?: string
  }) {
    const puede = condicion !== undefined
    const key = `${mesa.materiaId}-${mesa.fecha}`
    const anotado = mesasAnotadas[key]?.anotado ?? false
    const materia = MATERIAS.find((m) => m.id === mesa.materiaId)

    return (
      <div className={`rounded-lg border p-3 text-sm transition-all ${getMesasBadgeClass(condicion)}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-medium leading-tight">{materia?.nombre ?? mesa.nombreOficial}</p>
              {condicion === 'libre' && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Libre
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatFechaCorta(mesa.fecha)} · {mesa.hora}
              {mesa.aula && ` · ${mesa.aula}`}
            </p>
            {/* Regularidad vence antes de esta mesa */}
            {condicion === 'libre' && vencimientoAntesMesa && (
              <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                Reg. vence el {formatFechaArg(vencimientoAntesMesa)} (antes de la mesa)
              </p>
            )}
            {!puede && razon && (
              <p className="mt-1 text-xs italic text-muted-foreground">{razon}</p>
            )}
          </div>
          {puede && (
            <div className="flex shrink-0 flex-col gap-1">
              <button
                onClick={() => toggleAnotado(mesa.materiaId, mesa.fecha, turno.numero, condicion!)}
                className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                  anotado
                    ? condicion === 'libre'
                      ? 'border-amber-500 bg-amber-500 text-white'
                      : 'border-emerald-500 bg-emerald-500 text-white'
                    : condicion === 'libre'
                      ? 'border-border hover:border-amber-400 hover:text-amber-600'
                      : 'border-border hover:border-emerald-400 hover:text-emerald-600'
                }`}
              >
                {anotado ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Anotado
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {condicion === 'libre' ? 'Anotar (libre)' : 'Anotar'}
                  </span>
                )}
              </button>
              <a
                href={buildGCalUrl({
                  title: `Examen: ${materia?.nombre ?? mesa.nombreOficial}`,
                  date: mesa.fecha,
                  startTime: (() => {
                    const m = mesa.hora.match(/(\d{2})[.:](\d{2})/)
                    return m ? `${m[1]}:${m[2]}` : undefined
                  })(),
                  description: `${turno.nombre} · ${condicion === 'libre' ? 'Como libre' : 'Regular'}`,
                  location: mesa.aula ?? 'FAU-UNNE',
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:border-primary/50 hover:text-primary transition-colors"
                title="Agregar a Google Calendar"
              >
                <ExternalLink className="h-3 w-3" /> GCal
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }

  function exportarTurnoICS() {
    const anotadasEnTurno = [...mesasRegular, ...mesasLibre].filter(({ mesa }) => {
      const key = `${mesa.materiaId}-${mesa.fecha}`
      return mesasAnotadas[key]?.anotado
    })

    if (anotadasEnTurno.length === 0) {
      alert('No tenés mesas anotadas en este turno para exportar.')
      return
    }

    const events = anotadasEnTurno.map(({ mesa, resultado }) => {
      const materia = MATERIAS.find((m) => m.id === mesa.materiaId)
      const horaMatch = mesa.hora.match(/(\d{2})[.:](\d{2})/)
      const startTime = horaMatch ? `${horaMatch[1]}:${horaMatch[2]}` : undefined
      return {
        uid: `${mesa.materiaId}-${mesa.fecha}-${turno.numero}`,
        title: `Examen: ${materia?.nombre ?? mesa.nombreOficial}`,
        date: mesa.fecha,
        startTime,
        description: `${turno.nombre} · ${resultado.condicion === 'libre' ? 'Como libre' : 'Regular'}${mesa.aula ? ` · Aula: ${mesa.aula}` : ''}`,
        location: mesa.aula ?? 'FAU-UNNE',
      }
    })

    const ics = generateICS(events, `Mesas ${turno.nombre} FAU-UNNE`)
    downloadICS(ics, `mesas-${turno.numero}er-turno-2026`)
  }

  return (
    <div className="space-y-6">
      {/* Selector de turno */}
      <div className="flex flex-wrap gap-2">
        {TURNOS_2026.map((t) => {
          const pasado = new Date(t.fechaFin) < new Date()
          return (
            <button
              key={t.numero}
              onClick={() => setSelectedTurno(t.numero)}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                selectedTurno === t.numero
                  ? 'border-primary bg-primary text-primary-foreground'
                  : pasado
                    ? 'border-border bg-muted/50 text-muted-foreground'
                    : 'border-border hover:border-primary/50'
              }`}
            >
              {t.numero}° Turno
              <span className="ml-1 text-xs opacity-75">
                {t.fechaInicio.slice(5).split('-').reverse().join('/')}
              </span>
            </button>
          )
        })}
      </div>

      {/* Info del turno */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">{turno.nombre}</h3>
            <p className="text-sm text-muted-foreground">
              Inscripción: {formatFechaCorta(turno.inscripcionDesde)} al{' '}
              {formatFechaCorta(turno.inscripcionHasta)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {turno.suspensionClases && (
              <Badge variant="outline" className="text-xs">
                <Clock className="mr-1 h-3 w-3" />
                Suspensión de clases
              </Badge>
            )}
            {mesasRegular.length > 0 && (
              <Badge className="bg-emerald-600 text-xs">
                {mesasRegular.length} como regular
              </Badge>
            )}
            {mesasLibre.length > 0 && (
              <Badge className="bg-amber-500 text-xs">
                {mesasLibre.length} como libre
              </Badge>
            )}
            <button
              onClick={() => exportarTurnoICS()}
              title="Exportar mesas anotadas como .ics"
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:border-primary/50 hover:text-primary transition-colors"
            >
              <Download className="h-3 w-3" /> .ics
            </button>
          </div>
        </div>
      </div>

      {/* Mesas que puedo rendir como regular */}
      {mesasRegular.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Puedo rendir — Regular ({mesasRegular.length})
          </h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {mesasRegular.map(({ mesa, resultado }) => (
              <MesaCard
                key={mesa.materiaId}
                mesa={mesa}
                condicion={resultado.condicion}
                razon={resultado.razon}
                vencimientoAntesMesa={resultado.vencimientoAntesMesa}
              />
            ))}
          </div>
        </div>
      )}

      {/* Mesas que puedo rendir como libre */}
      {mesasLibre.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            Puedo rendir — Como libre ({mesasLibre.length})
          </h4>
          <p className="text-xs text-muted-foreground">
            Sin regularidad vigente para la fecha de la mesa. Podés inscribirte como alumno libre.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {mesasLibre.map(({ mesa, resultado }) => (
              <MesaCard
                key={mesa.materiaId}
                mesa={mesa}
                condicion={resultado.condicion}
                razon={resultado.razon}
                vencimientoAntesMesa={resultado.vencimientoAntesMesa}
              />
            ))}
          </div>
        </div>
      )}

      {/* Otras mesas */}
      {noRendibles.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            Otras materias en este turno
          </h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {noRendibles.map(({ mesa, resultado }) => (
              <MesaCard
                key={mesa.materiaId}
                mesa={mesa}
                condicion={undefined}
                razon={resultado.razon}
              />
            ))}
          </div>
        </div>
      )}

      {mesasUnicas.length === 0 && (
        <div className="py-10 text-center text-sm text-muted-foreground">
          No hay mesas de Arquitectura registradas para este turno.
        </div>
      )}
    </div>
  )
}
