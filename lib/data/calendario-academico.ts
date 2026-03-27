/**
 * Calendario Academico 2026 - FAU UNNE
 * Basado en RES - 2025 - 542 - CD-ARQ # UNNE
 *
 * Contiene los 7 turnos de examenes, las mesas por materia (Anexo III),
 * feriados (Anexo V), cuatrimestres y fechas academicas clave.
 */

export interface TurnoExamen {
  numero: number
  nombre: string
  fechaInicio: string       // YYYY-MM-DD
  fechaFin: string          // YYYY-MM-DD
  inscripcionDesde: string  // YYYY-MM-DD
  inscripcionHasta: string  // YYYY-MM-DD
  suspensionClases: boolean
}

export interface MesaExamen {
  // dia de la semana en que cae la mesa en cada turno
  diaSemana: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado'
  hora: string             // "08.00 hs" | "15.00 hs" | "19.00 hs"
  materiaId: string | null // id interno (null = no mapeada)
  nombreOficial: string    // nombre exacto del calendario
  aula?: string
}

// Los 7 turnos de 2026 (Anexo III)
export const TURNOS_2026: TurnoExamen[] = [
  {
    numero: 1,
    nombre: '1° Turno – Febrero 2026',
    fechaInicio: '2026-02-09',
    fechaFin: '2026-02-14',
    inscripcionDesde: '2026-02-03',
    inscripcionHasta: '2026-02-07',
    suspensionClases: false,
  },
  {
    numero: 2,
    nombre: '2° Turno – Marzo 2026',
    fechaInicio: '2026-03-09',
    fechaFin: '2026-03-14',
    inscripcionDesde: '2026-03-02',
    inscripcionHasta: '2026-03-07',
    suspensionClases: false,
  },
  {
    numero: 3,
    nombre: '3° Turno – Mayo 2026',
    fechaInicio: '2026-05-18',
    fechaFin: '2026-05-23',
    inscripcionDesde: '2026-05-11',
    inscripcionHasta: '2026-05-16',
    suspensionClases: true,
  },
  {
    numero: 4,
    nombre: '4° Turno – Julio 2026',
    fechaInicio: '2026-07-13',
    fechaFin: '2026-07-18',
    inscripcionDesde: '2026-07-06',
    inscripcionHasta: '2026-07-11',
    suspensionClases: true,
  },
  {
    numero: 5,
    nombre: '5° Turno – Agosto 2026',
    fechaInicio: '2026-08-10',
    fechaFin: '2026-08-15',
    inscripcionDesde: '2026-08-03',
    inscripcionHasta: '2026-08-08',
    suspensionClases: false,
  },
  {
    numero: 6,
    nombre: '6° Turno – Octubre 2026',
    fechaInicio: '2026-10-19',
    fechaFin: '2026-10-24',
    inscripcionDesde: '2026-10-13',
    inscripcionHasta: '2026-10-17',
    suspensionClases: true,
  },
  {
    numero: 7,
    nombre: '7° Turno – Diciembre 2026',
    fechaInicio: '2026-12-15',
    fechaFin: '2026-12-19',
    inscripcionDesde: '2026-12-07',
    inscripcionHasta: '2026-12-12',
    suspensionClases: false,
  },
]

/**
 * Mesas de ARQ segun el Anexo III del calendario (las que tienen dia/hora fijo).
 * Cada entrada indica en que dia y hora de la semana cae la mesa en todos los turnos.
 */
export const MESAS_ARQ: MesaExamen[] = [
  // Lunes
  { diaSemana: 'lunes', hora: '15.00 hs', materiaId: 'org_legislacion_gestion', nombreOficial: 'Patología de la Construcción', aula: 'Depto. Tecnológico' },

  // Martes
  { diaSemana: 'martes', hora: '08.00 hs', materiaId: 'teoria_diseno_1', nombreOficial: 'Teoría del Diseño Arquitectónico I', aula: 'A 12' },
  { diaSemana: 'martes', hora: '15.00 hs', materiaId: 'intro_tecnologia', nombreOficial: 'Introducción a la Tecnología', aula: 'T 9 - T 10 y Depto. Tecnológico' },
  { diaSemana: 'martes', hora: '15.00 hs', materiaId: 'construcciones_1', nombreOficial: 'Construcciones I (Plan 2018)', aula: 'A 12' },
  { diaSemana: 'martes', hora: '15.00 hs', materiaId: 'construcciones_2', nombreOficial: 'Construcciones II (Plan 2018)', aula: 'T 8' },
  { diaSemana: 'martes', hora: '15.00 hs', materiaId: 'historia_critica_2', nombreOficial: 'Historia y Crítica II', aula: 'A 11' },
  { diaSemana: 'martes', hora: '15.00 hs', materiaId: 'intro_urbanismo', nombreOficial: 'Introducción al Urbanismo y al Planeamiento (Plan 2018)', aula: 'A 5' },
  { diaSemana: 'martes', hora: '15.00 hs', materiaId: 'estructuras_2', nombreOficial: 'Estructuras II (Plan 2018)', aula: 'A 3' },
  { diaSemana: 'martes', hora: '15.00 hs', materiaId: 'ppa', nombreOficial: 'PPA (Plan 2018)', aula: 'ITDAHu' },
  { diaSemana: 'martes', hora: '19.00 hs', materiaId: 'construcciones_3', nombreOficial: 'Construcciones III B (Plan 2018)', aula: 'A 4 y Depto. Tecnológico' },

  // Miércoles
  { diaSemana: 'miercoles', hora: '15.00 hs', materiaId: 'historia_critica_1', nombreOficial: 'Historia y Crítica I', aula: 'A 12' },
  { diaSemana: 'miercoles', hora: '15.00 hs', materiaId: 'ciencias_basicas', nombreOficial: 'Ciencias Básicas', aula: 'A 11' },
  { diaSemana: 'miercoles', hora: '15.00 hs', materiaId: 'historia_critica_3', nombreOficial: 'Historia y Crítica III', aula: 'A 4' },

  // Jueves
  { diaSemana: 'jueves', hora: '08.00 hs', materiaId: 'teoria_diseno_2', nombreOficial: 'Teoría del Diseño Arquitectónico II (Plan 2018)', aula: 'A 12' },
  { diaSemana: 'jueves', hora: '08.00 hs', materiaId: 'instalaciones_2', nombreOficial: 'Instalaciones II - Instalaciones III (Plan 2018)', aula: 'T 10 y Depto. Tecnológico' },
  { diaSemana: 'jueves', hora: '15.00 hs', materiaId: 'organizacion_produccion_obras', nombreOficial: 'Gestión y Producción de Obras (Plan 2018)', aula: 'A 5' },
  { diaSemana: 'jueves', hora: '15.00 hs', materiaId: 'construcciones_3', nombreOficial: 'Construcciones III A (Plan 2018)', aula: 'A 4 y Depto. Tecnológico' },
  { diaSemana: 'jueves', hora: '15.00 hs', materiaId: 'urbanismo', nombreOficial: 'Urbanismo (Plan 2018)', aula: 'A 12' },
  { diaSemana: 'jueves', hora: '15.00 hs', materiaId: 'estructuras_1', nombreOficial: 'Estructuras I (Plan 2018)', aula: 'A 11' },

  // Viernes
  { diaSemana: 'viernes', hora: '15.00 hs', materiaId: 'org_legislacion_gestion', nombreOficial: 'Organización, Legislación y Práctica Profesional (Plan 2018)', aula: 'A 6' },
]

/**
 * Dado un turno y un día de la semana de la mesa, calcula la fecha exacta del examen.
 * Los turnos van de lunes a sábado (o viernes), la mesa cae en el día asignado dentro del turno.
 */
export function calcularFechaMesa(turno: TurnoExamen, diaSemana: string): string | null {
  const diasIndex: Record<string, number> = {
    lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6,
  }
  const targetDay = diasIndex[diaSemana]
  if (!targetDay) return null

  const inicio = new Date(turno.fechaInicio + 'T12:00:00')
  const fin = new Date(turno.fechaFin + 'T12:00:00')

  const current = new Date(inicio)
  while (current <= fin) {
    const dayOfWeek = current.getDay() // 0=domingo, 1=lunes...
    if (dayOfWeek === targetDay) {
      return current.toISOString().split('T')[0]
    }
    current.setDate(current.getDate() + 1)
  }
  return null
}

// ─── Datos adicionales 2026 (extraídos del calendario oficial de la FAU) ────

export interface Feriado {
  fecha: string   // YYYY-MM-DD
  nombre: string
  tipo: 'feriado' | 'asueto' | 'no_laborable'
}

export interface Cuatrimestre {
  nombre: string
  inicio: string  // YYYY-MM-DD
  fin: string     // YYYY-MM-DD
}

export interface PeriodoAcademico {
  nombre: string
  inicio: string
  fin?: string
}

/** Feriados, asuetos y días no laborables 2026 (Anexo V + datos scrapeados) */
export const FERIADOS_2026: Feriado[] = [
  { fecha: '2026-01-01', nombre: 'Año Nuevo', tipo: 'feriado' },
  { fecha: '2026-02-02', nombre: 'Fundación de Resistencia', tipo: 'feriado' },
  { fecha: '2026-02-16', nombre: 'Carnaval', tipo: 'feriado' },
  { fecha: '2026-02-17', nombre: 'Carnaval', tipo: 'feriado' },
  { fecha: '2026-03-23', nombre: 'Día no laborable con fines turísticos', tipo: 'no_laborable' },
  { fecha: '2026-03-24', nombre: 'Día de la Memoria por la Verdad y la Justicia', tipo: 'feriado' },
  { fecha: '2026-04-02', nombre: 'Veteranos y Caídos en Malvinas / Jueves Santo', tipo: 'feriado' },
  { fecha: '2026-04-03', nombre: 'Viernes Santo', tipo: 'feriado' },
  { fecha: '2026-05-01', nombre: 'Día del Trabajador', tipo: 'feriado' },
  { fecha: '2026-05-25', nombre: 'Revolución de Mayo', tipo: 'feriado' },
  { fecha: '2026-06-15', nombre: 'Gral. Martín M. de Güemes (trasladable)', tipo: 'feriado' },
  { fecha: '2026-06-20', nombre: 'Gral. Manuel Belgrano', tipo: 'feriado' },
  { fecha: '2026-07-09', nombre: 'Día de la Independencia', tipo: 'feriado' },
  { fecha: '2026-08-17', nombre: 'Gral. José de San Martín (trasladable)', tipo: 'feriado' },
  { fecha: '2026-08-27', nombre: 'San Fernando Rey', tipo: 'asueto' },
  { fecha: '2026-09-17', nombre: 'Día del Docente Universitario', tipo: 'no_laborable' },
  { fecha: '2026-09-21', nombre: 'Día del Estudiante', tipo: 'asueto' },
  { fecha: '2026-10-12', nombre: 'Día de Respeto a la Diversidad Cultural (trasladable)', tipo: 'feriado' },
  { fecha: '2026-11-23', nombre: 'Día de la Soberanía Nacional (20/11 trasladado)', tipo: 'feriado' },
  { fecha: '2026-11-26', nombre: 'Día del No Docente Universitario', tipo: 'asueto' },
  { fecha: '2026-12-08', nombre: 'Inmaculada Concepción', tipo: 'feriado' },
  { fecha: '2026-12-13', nombre: 'Día Provincial de la Memoria (Chaco)', tipo: 'feriado' },
  { fecha: '2026-12-14', nombre: 'Aniversario creación UNNE', tipo: 'asueto' },
  { fecha: '2026-12-25', nombre: 'Navidad', tipo: 'feriado' },
]

/** Cuatrimestres y receso invernal 2026 */
export const CUATRIMESTRES_2026: Cuatrimestre[] = [
  {
    nombre: '1° Cuatrimestre',
    inicio: '2026-03-16',
    fin: '2026-07-04',
  },
  {
    nombre: 'Receso Invernal',
    inicio: '2026-07-20',
    fin: '2026-07-31',
  },
  {
    nombre: '2° Cuatrimestre',
    inicio: '2026-08-18',
    fin: '2026-11-28',
  },
]

/** Fechas académicas clave 2026 (inicio de clases, actas, egresados, etc.) */
export const FECHAS_ACADEMICAS_2026: PeriodoAcademico[] = [
  { nombre: 'Inicio dictado asignaturas 1er cuatrimestre', inicio: '2026-03-16' },
  { nombre: 'Recuperatorios finales', inicio: '2026-02-18', fin: '2026-02-27' },
  { nombre: 'Presentación de Unidades Pedagógicas', inicio: '2026-03-04', fin: '2026-03-06' },
  { nombre: 'Acto Académico de Egresados (junio)', inicio: '2026-06-26' },
  { nombre: 'Fin dictado asignaturas 1er cuatrimestre', inicio: '2026-07-04' },
  { nombre: 'Inicio dictado asignaturas 2do cuatrimestre', inicio: '2026-08-18' },
  { nombre: 'Acto Académico de Egresados (noviembre)', inicio: '2026-11-27' },
  { nombre: 'Fin dictado asignaturas cuatrimestrales 2do cuatrimestre', inicio: '2026-11-28' },
  { nombre: 'Fin dictado asignaturas de Taller', inicio: '2026-12-04' },
]

/** Períodos de recuperatorios finales 2026 */
export const RECUPERATORIOS_2026 = [
  { inicio: '2026-02-18', fin: '2026-02-27', nombre: 'Recuperatorios finales' },
]

/**
 * Devuelve todas las fechas de mesas para una materia dada en todos los turnos.
 */
export function getFechasMesaParaMateria(materiaId: string): { turno: TurnoExamen; fecha: string }[] {
  const mesasDeMateria = MESAS_ARQ.filter((m) => m.materiaId === materiaId)
  const resultado: { turno: TurnoExamen; fecha: string }[] = []

  for (const turno of TURNOS_2026) {
    for (const mesa of mesasDeMateria) {
      const fecha = calcularFechaMesa(turno, mesa.diaSemana)
      if (fecha) {
        resultado.push({ turno, fecha })
      }
    }
  }

  return resultado.sort((a, b) => a.fecha.localeCompare(b.fecha))
}

/**
 * Obtiene los datos de mesas para un año dado.
 *
 * Intenta scrapear `/api/mesas-fau` (datos en vivo de la FAU).
 * Si falla o el año scrapeado no coincide, cae al fallback:
 *   - 2026 → datos hardcodeados (TURNOS_2026 + MESAS_ARQ)
 *   - otros años → arrays vacíos
 *
 * ⚠️ Solo apta para llamadas desde el browser (client components).
 */
export async function getMesasData(anio: number): Promise<{
  turnos: TurnoExamen[]
  mesas: MesaExamen[]
  source: 'scraper' | 'hardcoded'
}> {
  try {
    const res = await fetch('/api/mesas-fau')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { anio?: number; turnos?: TurnoExamen[]; mesas?: MesaExamen[] }

    if (
      data.anio === anio &&
      Array.isArray(data.turnos) && data.turnos.length > 0 &&
      Array.isArray(data.mesas) && data.mesas.length > 0
    ) {
      return { turnos: data.turnos, mesas: data.mesas, source: 'scraper' }
    }
  } catch {
    // silencioso — caer al fallback
  }

  if (anio === 2026) {
    return { turnos: TURNOS_2026, mesas: MESAS_ARQ, source: 'hardcoded' }
  }

  return { turnos: [], mesas: [], source: 'hardcoded' }
}
