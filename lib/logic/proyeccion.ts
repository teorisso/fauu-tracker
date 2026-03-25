import { MATERIAS } from '@/lib/data/materias'
import { Estado } from '@/lib/types'

function estaAprobada(estado: Estado): boolean {
  return estado === 'final_aprobado' || estado === 'promocionada'
}

export function calcularProyeccion(
  estados: Record<string, { estado: Estado; anio_cursado?: number }>
): { anioEstimado: number | null; mensaje: string } {
  const aprobadas = Object.entries(estados).filter(
    ([, e]) => estaAprobada(e.estado) && e.anio_cursado != null
  )

  if (aprobadas.length < 4) {
    return {
      anioEstimado: null,
      mensaje: 'Se necesitan al menos 4 materias con año registrado para estimar.',
    }
  }

  const aniosCalendario = new Set(aprobadas.map(([, e]) => e.anio_cursado!))
  const cantidadAnios = aniosCalendario.size
  const ritmo = aprobadas.length / cantidadAnios

  const totalObligatorias = MATERIAS.length
  const totalAprobadas = Object.values(estados).filter((e) =>
    estaAprobada(e.estado)
  ).length
  const pendientes = totalObligatorias - totalAprobadas

  if (pendientes <= 0) {
    return { anioEstimado: null, mensaje: '¡Completaste todas las materias obligatorias!' }
  }

  const aniosRestantes = Math.ceil(pendientes / ritmo)
  const anioActual = new Date().getFullYear()
  const anioEstimado = anioActual + aniosRestantes

  return {
    anioEstimado,
    mensaje: `A este ritmo, estimás recibirte en ${anioEstimado}. Estimación aproximada basada en tu ritmo actual.`,
  }
}
