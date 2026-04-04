import { MATERIAS } from '@/lib/data/materias'
import { MateriaEstado, Seminario, Estado, Logro, LogroDesbloqueado } from '@/lib/types'

function estaAprobada(estado?: Estado): boolean {
  return estado === 'final_aprobado' || estado === 'promocionada'
}

function materiasAprobadasCount(estados: Record<string, MateriaEstado>): number {
  return Object.values(estados).filter((e) => estaAprobada(e.estado)).length
}

function anioCompleto(anio: number, estados: Record<string, MateriaEstado>): boolean {
  const materiasDelAnio = MATERIAS.filter((m) => m.anio === anio)
  return materiasDelAnio.every((m) => {
    const e = estados[m.id]
    return e && estaAprobada(e.estado)
  })
}

function cicloCompleto(
  ciclo: 'introductorio' | 'formacion_disciplinar' | 'formacion_profesional',
  estados: Record<string, MateriaEstado>
): boolean {
  const materiasDelCiclo = MATERIAS.filter((m) => m.ciclo === ciclo)
  return materiasDelCiclo.every((m) => {
    const e = estados[m.id]
    return e && estaAprobada(e.estado)
  })
}

function tieneNota10(estados: Record<string, MateriaEstado>): boolean {
  return Object.values(estados).some(
    (e) => estaAprobada(e.estado) && e.nota != null && e.nota === 10
  )
}

function promedioAlto(estados: Record<string, MateriaEstado>): boolean {
  const conNota = Object.values(estados).filter(
    (e) => estaAprobada(e.estado) && e.nota != null
  )
  if (conNota.length < 5) return false
  const suma = conNota.reduce((acc, e) => acc + e.nota!, 0)
  return suma / conNota.length >= 8
}

function seminariosCompletos(seminarios: Seminario[]): boolean {
  return seminarios.filter((s) => estaAprobada(s.estado)).length >= 3
}

type EvaluadorLogro = (
  estados: Record<string, MateriaEstado>,
  seminarios: Seminario[]
) => boolean

interface LogroConEvaluador extends Logro {
  evaluar: EvaluadorLogro
}

const CATALOGO_LOGROS: LogroConEvaluador[] = [
  // Por año completado
  {
    id: 'anio_1',
    nombre: 'Primer Año',
    emoji: '🎒',
    descripcion: 'Completaste todas las materias de 1er año',
    categoria: 'anio',
    orden: 1,
    evaluar: (e) => anioCompleto(1, e),
  },
  {
    id: 'anio_2',
    nombre: 'Segundo Año',
    emoji: '📐',
    descripcion: 'Completaste todas las materias de 2do año',
    categoria: 'anio',
    orden: 2,
    evaluar: (e) => anioCompleto(2, e),
  },
  {
    id: 'anio_3',
    nombre: 'Tercer Año',
    emoji: '🏗️',
    descripcion: 'Completaste todas las materias de 3er año',
    categoria: 'anio',
    orden: 3,
    evaluar: (e) => anioCompleto(3, e),
  },
  {
    id: 'anio_4',
    nombre: 'Cuarto Año',
    emoji: '🏛️',
    descripcion: 'Completaste todas las materias de 4to año',
    categoria: 'anio',
    orden: 4,
    evaluar: (e) => anioCompleto(4, e),
  },
  {
    id: 'anio_5',
    nombre: 'Quinto Año',
    emoji: '🎓',
    descripcion: 'Completaste todas las materias de 5to año',
    categoria: 'anio',
    orden: 5,
    evaluar: (e) => anioCompleto(5, e),
  },
  {
    id: 'anio_6',
    nombre: 'Sexto Año',
    emoji: '🏆',
    descripcion: 'Completaste todas las materias de 6to año',
    categoria: 'anio',
    orden: 6,
    evaluar: (e) => anioCompleto(6, e),
  },

  // Por cantidad de materias
  {
    id: 'primera_materia',
    nombre: 'Primera Materia',
    emoji: '🌱',
    descripcion: 'Aprobaste tu primera materia',
    categoria: 'cantidad',
    orden: 1,
    evaluar: (e) => materiasAprobadasCount(e) >= 1,
  },
  {
    id: 'racha_5',
    nombre: 'Racha de 5',
    emoji: '🔥',
    descripcion: 'Aprobaste 5 materias',
    categoria: 'cantidad',
    orden: 2,
    evaluar: (e) => materiasAprobadasCount(e) >= 5,
  },
  {
    id: 'doble_digito',
    nombre: 'Doble Dígito',
    emoji: '⭐',
    descripcion: 'Aprobaste 10 materias',
    categoria: 'cantidad',
    orden: 3,
    evaluar: (e) => materiasAprobadasCount(e) >= 10,
  },
  {
    id: 'media_carrera',
    nombre: 'Media Carrera',
    emoji: '💪',
    descripcion: 'Aprobaste la mitad de las materias',
    categoria: 'cantidad',
    orden: 4,
    evaluar: (e) => materiasAprobadasCount(e) >= Math.ceil(MATERIAS.length / 2),
  },
  {
    id: 'recta_final',
    nombre: 'Recta Final',
    emoji: '🚀',
    descripcion: 'Aprobaste el 75% de las materias',
    categoria: 'cantidad',
    orden: 5,
    evaluar: (e) =>
      materiasAprobadasCount(e) >= Math.ceil(MATERIAS.length * 0.75),
  },
  {
    id: 'todas_aprobadas',
    nombre: 'Todas Aprobadas',
    emoji: '👑',
    descripcion: '¡Aprobaste las 33 materias obligatorias!',
    categoria: 'cantidad',
    orden: 6,
    evaluar: (e) => materiasAprobadasCount(e) >= MATERIAS.length,
  },

  // Por ciclo
  {
    id: 'ciclo_intro',
    nombre: 'Ciclo Introductorio',
    emoji: '🏁',
    descripcion: 'Completaste el Ciclo Introductorio',
    categoria: 'ciclo',
    orden: 1,
    evaluar: (e) => cicloCompleto('introductorio', e),
  },
  {
    id: 'ciclo_disciplinar',
    nombre: 'Ciclo Disciplinar',
    emoji: '📚',
    descripcion: 'Completaste el Ciclo de Formación Disciplinar',
    categoria: 'ciclo',
    orden: 2,
    evaluar: (e) => cicloCompleto('formacion_disciplinar', e),
  },
  {
    id: 'ciclo_profesional',
    nombre: 'Ciclo Profesional',
    emoji: '🎩',
    descripcion: 'Completaste el Ciclo de Formación Profesional',
    categoria: 'ciclo',
    orden: 3,
    evaluar: (e) => cicloCompleto('formacion_profesional', e),
  },

  // Especiales
  {
    id: 'diez_perfecto',
    nombre: 'Diez Perfecto',
    emoji: '💯',
    descripcion: 'Sacaste un 10 en al menos una materia',
    categoria: 'especial',
    orden: 1,
    evaluar: (e) => tieneNota10(e),
  },
  {
    id: 'promedio_alto',
    nombre: 'Promedio Alto',
    emoji: '📈',
    descripcion: 'Tu promedio es 8 o más (mín. 5 materias con nota)',
    categoria: 'especial',
    orden: 2,
    evaluar: (e) => promedioAlto(e),
  },
  {
    id: 'tfc_aprobado',
    nombre: 'TFC Aprobado',
    emoji: '🎓',
    descripcion: 'Aprobaste el Trabajo Final de Carrera',
    categoria: 'especial',
    orden: 3,
    evaluar: (e) => {
      const tfc = e['tfc']
      return !!tfc && estaAprobada(tfc.estado)
    },
  },
  {
    id: 'ppa_completada',
    nombre: 'PPA Completada',
    emoji: '🏥',
    descripcion: 'Completaste la Práctica Profesional Asistida',
    categoria: 'especial',
    orden: 4,
    evaluar: (e) => {
      const ppa = e['ppa']
      return !!ppa && estaAprobada(ppa.estado)
    },
  },
  {
    id: 'seminarios_ok',
    nombre: 'Seminarios OK',
    emoji: '🎉',
    descripcion: 'Aprobaste los 3 seminarios optativos',
    categoria: 'especial',
    orden: 5,
    evaluar: (_e, s) => seminariosCompletos(s),
  },
]

/**
 * Calcula todos los logros evaluando el estado actual.
 * Retorna la lista completa con el flag desbloqueado.
 */
export function calcularLogros(
  estados: Record<string, MateriaEstado>,
  seminarios: Seminario[]
): LogroDesbloqueado[] {
  return CATALOGO_LOGROS.map((logro) => {
    const { evaluar, ...logroData } = logro
    return {
      logro: logroData,
      desbloqueado: evaluar(estados, seminarios),
    }
  })
}

/**
 * Devuelve los IDs de logros desbloqueados para comparación rápida.
 */
export function logrosDesbloqueadosIds(
  estados: Record<string, MateriaEstado>,
  seminarios: Seminario[]
): Set<string> {
  const resultado = calcularLogros(estados, seminarios)
  return new Set(resultado.filter((l) => l.desbloqueado).map((l) => l.logro.id))
}
