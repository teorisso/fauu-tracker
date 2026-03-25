import * as XLSX from 'xlsx'
import { GUARANI_CODE_MAP } from '@/lib/data/guaraniCodeMap'
import { Estado } from '@/lib/types'

export interface GuaraniMateria {
  codigoGuarani: string
  nombreGuarani: string
  materiaId: string | null
  estadoDetectado: Estado
  nota?: number
  fecha_regularidad?: string // YYYY-MM-DD
  fecha_aprobacion?: string  // YYYY-MM-DD
  anio_cursado?: number
  cuatrimestre?: 1 | 2
  intentos_previos: number
  esOptativo: boolean
}

const ESTADO_PRIORIDAD: Record<Estado, number> = {
  sin_cursar: 0,
  cursando: 1,
  regular_vencida: 2,
  regular_vigente: 3,
  promocionada: 4,
  final_aprobado: 5,
}

const ARQ_CODE_REGEX = /\((ARQ-[\w.-]+)\)\s*$/

// Convert DD/MM/YYYY string to YYYY-MM-DD
function parseFechaGuarani(fechaStr: string): string | null {
  if (!fechaStr || typeof fechaStr !== 'string') return null
  const parts = fechaStr.trim().split('/')
  if (parts.length !== 3) return null
  const [dia, mes, anio] = parts
  if (!dia || !mes || !anio) return null
  return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
}

// Extract year and cuatrimestre from a YYYY-MM-DD date
function fechaToAnioYCuatrimestre(fecha: string): { anio: number; cuatrimestre: 1 | 2 } | null {
  if (!fecha) return null
  const [anioStr, mesStr] = fecha.split('-')
  const anio = parseInt(anioStr)
  const mes = parseInt(mesStr)
  if (isNaN(anio) || isNaN(mes)) return null
  return { anio, cuatrimestre: mes <= 7 ? 1 : 2 }
}

function cleanNota(valor: unknown): number | undefined {
  if (valor === null || valor === undefined || valor === '') return undefined
  const str = String(valor).trim()
  // Skip non-numeric marks like 'A', 'R'
  if (/^[A-Za-z]$/.test(str)) return undefined
  const num = parseFloat(str)
  return !isNaN(num) && num >= 1 && num <= 10 ? num : undefined
}

interface RowData {
  actividad: string
  fecha: string
  tipo: string
  nota: unknown
  resultado: string
}

function parseRows(sheet: XLSX.WorkSheet): RowData[] {
  const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })
  const rows: RowData[] = []

  // Find the header row (contains "Actividad" and "Fecha")
  let headerRowIndex = -1
  for (let i = 0; i < json.length; i++) {
    const row = json[i]
    if (
      Array.isArray(row) &&
      row.some((cell) => String(cell).trim() === 'Actividad') &&
      row.some((cell) => String(cell).trim() === 'Fecha')
    ) {
      headerRowIndex = i
      break
    }
  }

  if (headerRowIndex === -1) return rows

  const headers = (json[headerRowIndex] as string[]).map((h) => String(h).trim().toLowerCase())
  const colActividad = headers.indexOf('actividad')
  const colFecha = headers.indexOf('fecha')
  const colTipo = headers.indexOf('tipo')
  const colNota = headers.indexOf('nota')
  const colResultado = headers.indexOf('resultado')

  if (colActividad === -1 || colFecha === -1) return rows

  for (let i = headerRowIndex + 1; i < json.length; i++) {
    const row = json[i] as unknown[]
    const actividad = String(row[colActividad] ?? '').trim()
    if (!actividad || !ARQ_CODE_REGEX.test(actividad)) continue

    rows.push({
      actividad,
      fecha: String(row[colFecha] ?? '').trim(),
      tipo: String(row[colTipo] ?? '').trim(),
      nota: row[colNota],
      resultado: String(row[colResultado] ?? '').trim(),
    })
  }

  return rows
}

export function parsearArchivoGuarani(buffer: ArrayBuffer): GuaraniMateria[] {
  const data = new Uint8Array(buffer)
  const workbook = XLSX.read(data, { type: 'array', cellDates: false })

  // Use first sheet
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = parseRows(sheet)

  // Group rows by ARQ code
  const groupedByCode = new Map<string, { nombre: string; rows: RowData[] }>()

  for (const row of rows) {
    const match = row.actividad.match(ARQ_CODE_REGEX)
    if (!match) continue
    const code = match[1]
    const nombre = row.actividad.replace(ARQ_CODE_REGEX, '').trim()

    if (!groupedByCode.has(code)) {
      groupedByCode.set(code, { nombre, rows: [] })
    }
    groupedByCode.get(code)!.rows.push(row)
  }

  const materias: GuaraniMateria[] = []

  for (const [code, { nombre, rows: codeRows }] of Array.from(groupedByCode)) {
    // Skip SEMINARIO entries per user request
    if (
      nombre.toUpperCase().includes('SEMINARIO') &&
      !GUARANI_CODE_MAP[code]
    ) {
      continue
    }

    let mejorEstado: Estado = 'sin_cursar'
    let nota: number | undefined
    let fecha_regularidad: string | undefined
    let fecha_aprobacion: string | undefined
    let intentos = 0

    for (const row of codeRows) {
      const tipo = row.tipo.toLowerCase()
      const resultado = row.resultado.toLowerCase()
      const fechaISO = parseFechaGuarani(row.fecha) ?? undefined

      // "En curso" / "En Curso"
      if (tipo === 'en curso' || resultado === 'en curso') {
        if (ESTADO_PRIORIDAD['cursando'] > ESTADO_PRIORIDAD[mejorEstado]) {
          mejorEstado = 'cursando'
        }
        continue
      }

      if (tipo.includes('promocion') || tipo.includes('promoci')) {
        if (resultado.includes('promocionado') || resultado.includes('aprobado')) {
          if (ESTADO_PRIORIDAD['promocionada'] > ESTADO_PRIORIDAD[mejorEstado]) {
            mejorEstado = 'promocionada'
            nota = cleanNota(row.nota) ?? nota
            fecha_aprobacion = fechaISO
          }
        }
        continue
      }

      if (tipo.includes('regularidad') || tipo.includes('regular')) {
        if (resultado.includes('aprobado') || resultado.includes('aprobada')) {
          // Only upgrade to regular_vigente if no better state
          if (ESTADO_PRIORIDAD['regular_vigente'] > ESTADO_PRIORIDAD[mejorEstado]) {
            mejorEstado = 'regular_vigente'
          }
          // Always keep the latest regularidad date
          fecha_regularidad = fechaISO
        }
        continue
      }

      if (tipo.includes('examen') || tipo.includes('final')) {
        if (resultado.includes('aprobado') && !resultado.includes('reprobado') && !resultado.includes('desaprobado')) {
          if (ESTADO_PRIORIDAD['final_aprobado'] > ESTADO_PRIORIDAD[mejorEstado]) {
            mejorEstado = 'final_aprobado'
            nota = cleanNota(row.nota) ?? nota
            fecha_aprobacion = fechaISO
          }
        } else if (
          resultado.includes('reprobado') ||
          resultado.includes('desaprobado') ||
          resultado.includes('ausente')
        ) {
          intentos++
        }
        continue
      }
    }

    // Derive anio_cursado and cuatrimestre from the most relevant date
    const fechaReferencia = fecha_aprobacion ?? fecha_regularidad
    const fechaData = fechaReferencia ? fechaToAnioYCuatrimestre(fechaReferencia) : null

    const materiaId = GUARANI_CODE_MAP[code] ?? null

    materias.push({
      codigoGuarani: code,
      nombreGuarani: nombre,
      materiaId,
      estadoDetectado: mejorEstado,
      nota,
      fecha_regularidad,
      fecha_aprobacion,
      anio_cursado: fechaData?.anio,
      cuatrimestre: fechaData?.cuatrimestre,
      intentos_previos: intentos,
      esOptativo: materiaId === null,
    })
  }

  return materias
}
