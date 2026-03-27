import type { TurnoExamen, MesaExamen } from '@/lib/data/calendario-academico'
import { MESA_NAME_MAP } from '@/lib/data/mesa-name-map'

export interface ScrapedMesasData {
  anio: number
  turnos: TurnoExamen[]
  mesas: MesaExamen[]
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// Normalize Spanish accented day names → internal diaSemana type
function normalizeDia(dia: string): MesaExamen['diaSemana'] | null {
  const map: Record<string, MesaExamen['diaSemana']> = {
    'Lunes': 'lunes',
    'Martes': 'martes',
    'Miércoles': 'miercoles',
    'Miercoles': 'miercoles',
    'Jueves': 'jueves',
    'Viernes': 'viernes',
    'Sábado': 'sabado',
    'Sabado': 'sabado',
  }
  return map[dia] ?? null
}

// Convert EVENTS time format ('08:00') → MesaExamen hora format ('08.00 hs')
function normalizeHora(time: string): string {
  return time.replace(':', '.') + ' hs'
}

/**
 * Extract a bracket/brace-balanced block from HTML source.
 * Finds `startToken` first, then looks for the first occurrence of `open`
 * and returns everything up to the matching `close`.
 */
function extractBalanced(
  html: string,
  startToken: string,
  open: string,
  close: string
): string | null {
  const tokenIdx = html.indexOf(startToken)
  if (tokenIdx === -1) return null

  const openIdx = html.indexOf(open, tokenIdx)
  if (openIdx === -1) return null

  let depth = 0
  let end = -1
  for (let i = openIdx; i < html.length; i++) {
    if (html[i] === open) depth++
    else if (html[i] === close) {
      depth--
      if (depth === 0) { end = i; break }
    }
  }
  if (end === -1) return null
  return html.slice(openIdx, end + 1)
}

/**
 * Parse the TURNOS object from the page into a map:
 *   turnoNum → { diaSemana → 'YYYY-MM-DD' }
 *
 * TURNOS format from the page:
 *   { 'Lunes': { line1: 'T1 09/02 – T2 09/03 …', line2: 'T4 13/07 …' }, … }
 */
function parseTurnoDateMap(
  turnosRaw: Record<string, { line1: string; line2: string }>,
  anio: number
): Record<number, Record<string, string>> {
  const turnoDateMap: Record<number, Record<string, string>> = {}
  const turnoRegex = /T(\d+)\s+(\d{2})\/(\d{2})/g

  for (const [dayName, { line1, line2 }] of Object.entries(turnosRaw)) {
    const diaNorm = normalizeDia(dayName)
    if (!diaNorm) continue

    const combined = line1 + ' ' + line2
    let m: RegExpExecArray | null
    turnoRegex.lastIndex = 0

    while ((m = turnoRegex.exec(combined)) !== null) {
      const turnoNum = parseInt(m[1])
      const day = m[2]
      const month = m[3]
      const dateStr = `${anio}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

      if (!turnoDateMap[turnoNum]) turnoDateMap[turnoNum] = {}
      turnoDateMap[turnoNum][diaNorm] = dateStr
    }
  }

  return turnoDateMap
}

/** Build TurnoExamen[] from the date map, deriving fechaInicio/fechaFin from the actual dates. */
function buildTurnos(
  turnoDateMap: Record<number, Record<string, string>>,
  anio: number
): TurnoExamen[] {
  const turnos: TurnoExamen[] = []

  for (const [numStr, dateByDay] of Object.entries(turnoDateMap)) {
    const numero = parseInt(numStr)
    const dates = Object.values(dateByDay).sort()
    if (dates.length === 0) continue

    const fechaInicio = dates[0]
    const fechaFin = dates[dates.length - 1]
    const month = parseInt(fechaInicio.split('-')[1]) - 1

    turnos.push({
      numero,
      nombre: `${numero}° Turno – ${MONTH_NAMES[month]} ${anio}`,
      fechaInicio,
      fechaFin,
      // Inscripcion dates are not available in the turno-examenes page
      inscripcionDesde: '',
      inscripcionHasta: '',
      suspensionClases: false,
    })
  }

  return turnos.sort((a, b) => a.numero - b.numero)
}

/**
 * Map a FAU exam title to one or more materiaIds.
 * Returns [null] for optativas or unknown titles.
 */
function mapTitleToMaterias(title: string): (string | null)[] {
  if (title in MESA_NAME_MAP) {
    const entry = MESA_NAME_MAP[title]
    if (entry === null) return [null]
    if (Array.isArray(entry)) return entry
    return [entry]
  }

  // Composite titles like "PPA (Plan 2018) / Seminario …" — try first segment
  const firstSegment = title.split(' / ')[0].trim()
  if (firstSegment !== title && firstSegment in MESA_NAME_MAP) {
    const entry = MESA_NAME_MAP[firstSegment]
    if (entry === null) return [null]
    if (Array.isArray(entry)) return entry
    return [entry]
  }

  return [null]
}

/**
 * Scrape the FAU exam schedule page and return structured mesa data.
 *
 * Parses the `FAUExamsWidget` web component's embedded `EVENTS` and `TURNOS`
 * JS constants to extract the year, per-turno date map, and the list of
 * Architecture exam mesas with their materiaId mappings.
 */
export async function scrapeMesasFAU(): Promise<ScrapedMesasData> {
  const html = await fetch('https://www.arq.unne.edu.ar/turno-examenes/', {
    next: { revalidate: 86400 },
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FAUU-Tracker/1.0)' },
  }).then((r) => r.text())

  // Extract year from <h2> heading (e.g. <h2 ...>2026</h2>)
  const yearMatch = html.match(/<h2[^>]*>\s*(\d{4})\s*<\/h2>/)
  const anio = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear()

  // Extract and evaluate EVENTS array
  const eventsRaw = extractBalanced(html, 'const EVENTS =', '[', ']')
  if (!eventsRaw) throw new Error('EVENTS not found in turno-examenes page')

  // Extract and evaluate TURNOS object
  const turnosRaw = extractBalanced(html, 'const TURNOS =', '{', '}')
  if (!turnosRaw) throw new Error('TURNOS not found in turno-examenes page')

  // eslint-disable-next-line no-new-func
  const events = new Function(`return ${eventsRaw}`)() as Array<{
    day: string
    time: string
    title: string
    careers: string[]
    lugar: string
  }>

  // eslint-disable-next-line no-new-func
  const turnosObj = new Function(`return (${turnosRaw})`)() as Record<
    string,
    { line1: string; line2: string }
  >

  const turnoDateMap = parseTurnoDateMap(turnosObj, anio)
  const turnos = buildTurnos(turnoDateMap, anio)

  // Filter to ARQ-career events and map to MesaExamen
  const mesas: MesaExamen[] = []
  // Deduplicate by materiaId + diaSemana + hora (avoid duplicate entries for
  // combined courses like "Construcciones III A" and "Construcciones III B"
  // which both map to construcciones_3 but appear at different hours)
  const seen = new Set<string>()

  for (const event of events) {
    if (!event.careers.includes('arq')) continue

    const diaSemana = normalizeDia(event.day)
    if (!diaSemana) continue

    const hora = normalizeHora(event.time)
    const materiaIds = mapTitleToMaterias(event.title)

    for (const materiaId of materiaIds) {
      const key = `${materiaId ?? '_opt'}-${diaSemana}-${hora}`
      if (seen.has(key)) continue
      seen.add(key)

      mesas.push({
        diaSemana,
        hora,
        materiaId: materiaId ?? null,
        nombreOficial: event.title,
        aula: event.lugar || undefined,
      })
    }
  }

  return { anio, turnos, mesas }
}
