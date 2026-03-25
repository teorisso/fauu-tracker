import { MATERIAS } from '@/lib/data/materias'
import { Estado } from '@/lib/types'

function estaAprobada(estado: Estado): boolean {
  return estado === 'final_aprobado' || estado === 'promocionada'
}

export function calcularPromedio(
  estados: Record<string, { estado: Estado; nota?: number }>
): { promedio: number | null; materiasConNota: number } {
  const conNota = Object.values(estados).filter(
    (e) => estaAprobada(e.estado) && e.nota != null
  )

  if (conNota.length === 0) {
    return { promedio: null, materiasConNota: 0 }
  }

  const suma = conNota.reduce((acc, e) => acc + e.nota!, 0)
  return {
    promedio: Math.round((suma / conNota.length) * 100) / 100,
    materiasConNota: conNota.length,
  }
}

export function calcularHorasAcreditadas(
  estados: Record<string, Estado>
): number {
  return MATERIAS.reduce((acc, materia) => {
    const estado = estados[materia.id]
    if (estado && estaAprobada(estado)) {
      return acc + materia.horasCatedra
    }
    return acc
  }, 0)
}
