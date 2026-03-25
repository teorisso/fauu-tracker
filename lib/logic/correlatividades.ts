import { CORRELATIVIDADES } from '@/lib/data/correlatividades'
import { MATERIAS } from '@/lib/data/materias'
import { Estado } from '@/lib/types'

function estaAprobada(estado: Estado | undefined): boolean {
  return estado === 'final_aprobado' || estado === 'promocionada'
}

function estaRegularizada(estado: Estado | undefined): boolean {
  return estado === 'regular_vigente' || estaAprobada(estado)
}

function nombreMateria(id: string): string {
  return MATERIAS.find((m) => m.id === id)?.nombre ?? id
}

export function validarCorrelatividades(
  materiaId: string,
  estadoActual: Record<string, Estado>
): {
  cumple: boolean
  faltantes: { nombre: string; condicion: 'aprobada' | 'regularizada' }[]
} {
  const regla = CORRELATIVIDADES.find((r) => r.materiaId === materiaId)
  if (!regla) return { cumple: true, faltantes: [] }

  const faltantes: { nombre: string; condicion: 'aprobada' | 'regularizada' }[] = []

  for (const req of regla.paraPoderCursar) {
    const estado = estadoActual[req.materiaId]
    const cumpleReq =
      req.condicion === 'aprobada'
        ? estaAprobada(estado)
        : estaRegularizada(estado)

    if (!cumpleReq) {
      faltantes.push({
        nombre: nombreMateria(req.materiaId),
        condicion: req.condicion,
      })
    }
  }

  if (regla.requiereAnioCompleto) {
    const materiasDelAnio = MATERIAS.filter(
      (m) => m.anio === regla.requiereAnioCompleto
    )
    for (const m of materiasDelAnio) {
      if (!estaRegularizada(estadoActual[m.id])) {
        faltantes.push({
          nombre: m.nombre,
          condicion: 'regularizada',
        })
      }
    }
  }

  return { cumple: faltantes.length === 0, faltantes }
}
