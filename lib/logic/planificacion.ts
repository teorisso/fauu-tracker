import { MateriaEstado } from '@/lib/types'
import { MATERIAS } from '@/lib/data/materias'
import { CORRELATIVIDADES } from '@/lib/data/correlatividades'
import {
  TURNOS_2026,
  MESAS_ARQ,
  calcularFechaMesa,
  type TurnoExamen,
} from '@/lib/data/calendario-academico'
import { getVencimientoInfo } from '@/lib/logic/vencimientos'

export type UrgenciaExamen = 'critica' | 'alta' | 'normal'

export interface SugerenciaExamen {
  materiaId: string
  nombre: string
  turno: TurnoExamen
  fechaMesa: string    // YYYY-MM-DD
  urgencia: UrgenciaExamen
  razon: string
}

function estaAprobada(estado: string | undefined): boolean {
  return estado === 'final_aprobado' || estado === 'promocionada'
}

function estaRegularizada(estado: string | undefined): boolean {
  return estado === 'regular_vigente' || estaAprobada(estado)
}

/** Cuantas materias desbloquea aprobar esta materia */
function materiasDesbloqueadas(materiaId: string, estados: Record<string, MateriaEstado>): number {
  let count = 0
  for (const regla of CORRELATIVIDADES) {
    // Already satisfied
    if (estaAprobada(estados[regla.materiaId]?.estado)) continue
    // Would this materia completing make the regla closer?
    const depende = regla.paraPoderCursar.some((r) => r.materiaId === materiaId)
    if (depende) count++
  }
  return count
}

/** Verifica si el alumno puede rendir el final de esta materia ahora */
function puedeRendirFinal(materiaId: string, estados: Record<string, MateriaEstado>): boolean {
  const e = estados[materiaId]
  if (!e || e.estado !== 'regular_vigente') return false

  // Check correlatividades para el examen final (usar las mismas que para cursar)
  const regla = CORRELATIVIDADES.find((r) => r.materiaId === materiaId)
  if (!regla) return true

  for (const req of regla.paraPoderCursar) {
    const est = estados[req.materiaId]?.estado
    if (req.condicion === 'aprobada' && !estaAprobada(est)) return false
    if (req.condicion === 'regularizada' && !estaRegularizada(est)) return false
  }

  return true
}

/** Proxima mesa disponible para una materia en un turno futuro */
function proximaMesaFutura(materiaId: string): { turno: TurnoExamen; fecha: string } | null {
  const hoy = new Date()
  const mesasDeMateria = MESAS_ARQ.filter((m) => m.materiaId === materiaId)

  for (const turno of TURNOS_2026) {
    // Skip past turnos
    if (new Date(turno.fechaFin) < hoy) continue

    for (const mesa of mesasDeMateria) {
      const fecha = calcularFechaMesa(turno, mesa.diaSemana)
      if (fecha && new Date(fecha) >= hoy) {
        return { turno, fecha }
      }
    }
  }
  return null
}

/**
 * Genera sugerencias de exámenes priorizadas por:
 * 1. Regularidades próximas a vencer (urgencia crítica/alta)
 * 2. Materias que desbloquean más correlatividades
 * 3. Años inferiores primero
 */
export function sugerirProximosExamenes(
  estados: Record<string, MateriaEstado>
): SugerenciaExamen[] {
  const sugerencias: SugerenciaExamen[] = []

  for (const materia of MATERIAS) {
    const e = estados[materia.id]
    if (!e || e.estado !== 'regular_vigente') continue
    if (!puedeRendirFinal(materia.id, estados)) continue

    const proximaMesa = proximaMesaFutura(materia.id)
    if (!proximaMesa) continue

    let urgencia: UrgenciaExamen = 'normal'
    let razon = `Año ${materia.anio}`

    // Prioridad por vencimiento
    if (e.vencimiento_regularidad) {
      const info = getVencimientoInfo(e.vencimiento_regularidad)
      if (info.dias < 30) {
        urgencia = 'critica'
        razon = `Regularidad vence en ${info.dias} días`
      } else if (info.dias < 90) {
        urgencia = 'alta'
        razon = `Regularidad vence el ${e.vencimiento_regularidad.split('-').reverse().join('/')}`
      }
    }

    // Bonus por desbloquear correlatividades
    const desbloquea = materiasDesbloqueadas(materia.id, estados)
    if (urgencia === 'normal' && desbloquea >= 2) {
      urgencia = 'alta'
      razon = `Desbloquea ${desbloquea} materia${desbloquea > 1 ? 's' : ''}`
    }

    sugerencias.push({
      materiaId: materia.id,
      nombre: materia.nombre,
      turno: proximaMesa.turno,
      fechaMesa: proximaMesa.fecha,
      urgencia,
      razon,
    })
  }

  // Sort: critica > alta > normal, luego por año, luego por fecha de mesa
  const urgenciaPeso: Record<UrgenciaExamen, number> = {
    critica: 0,
    alta: 1,
    normal: 2,
  }

  sugerencias.sort((a, b) => {
    const pa = urgenciaPeso[a.urgencia]
    const pb = urgenciaPeso[b.urgencia]
    if (pa !== pb) return pa - pb

    const ya = MATERIAS.find((m) => m.id === a.materiaId)?.anio ?? 9
    const yb = MATERIAS.find((m) => m.id === b.materiaId)?.anio ?? 9
    if (ya !== yb) return ya - yb

    return a.fechaMesa.localeCompare(b.fechaMesa)
  })

  return sugerencias.slice(0, 5)
}

/**
 * Calcula dias hasta el proximo turno de examenes con inscripcion abierta.
 */
export function proximoTurnoConInscripcion(): TurnoExamen | null {
  const hoy = new Date()
  for (const turno of TURNOS_2026) {
    if (new Date(turno.inscripcionHasta) >= hoy) {
      return turno
    }
  }
  return null
}
