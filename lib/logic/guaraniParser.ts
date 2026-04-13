import * as XLSX from 'xlsx'
import { GUARANI_CODE_MAP } from '@/lib/data/guaraniCodeMap'
import { Estado } from '@/lib/types'

type GuaraniFileType = 'xls' | 'pdf'
type PdfJsModule = typeof import('pdfjs-dist')

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
const PDF_ROW_REGEX = /^(.+?\(ARQ-[\w.-]+\))\s+(\d{2}\/\d{2}\/\d{4})\s+(.+)$/
const PDF_PAGE_INFO_REGEX = /^\d+\s+DE\s+\d+\s+\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/
const PDF_PAGE_BREAK_REGEX = /^--\s*\d+\s+OF\s+\d+\s*--$/
const PDF_Y_TOLERANCE = 2
const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/

let pdfJsModulePromise: Promise<PdfJsModule> | null = null
let pdfWorkerConfigured = false

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

interface PdfTextItem {
  str: string
  transform: number[]
}

interface XlsColumnIndexes {
  actividad: number
  fecha: number
  tipo: number
  nota: number
  resultado: number
}

function getPdfJsModule(): Promise<PdfJsModule> {
  pdfJsModulePromise ??= import('pdfjs-dist').then((module) => {
    if (!pdfWorkerConfigured && typeof window !== 'undefined' && 'Worker' in window) {
      module.GlobalWorkerOptions.workerPort = new Worker(
        new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url),
        { type: 'module' }
      )
      pdfWorkerConfigured = true
    }

    return module
  })
  return pdfJsModulePromise
}

function normalizeGuaraniText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isPdfTextItem(item: unknown): item is PdfTextItem {
  if (typeof item !== 'object' || item === null) return false

  const maybeItem = item as Record<string, unknown>
  return (
    typeof maybeItem.str === 'string' &&
    Array.isArray(maybeItem.transform) &&
    maybeItem.transform.every((value) => typeof value === 'number')
  )
}

function isPdfHeaderLine(line: string): boolean {
  const normalized = normalizeGuaraniText(line).toUpperCase()

  if (!normalized) return true
  if (normalized === 'HISTORIA ACADEMICA') return true
  if (normalized === 'ACTIVIDAD FECHA TIPO NOTA RESULTADO') return true
  if (normalized.startsWith('PROPUESTA:')) return true
  if (normalized.startsWith('ALUMNO:')) return true
  if (PDF_PAGE_INFO_REGEX.test(normalized)) return true
  if (PDF_PAGE_BREAK_REGEX.test(normalized)) return true

  return false
}

function parsePdfLine(line: string): RowData | null {
  const cleanedLine = line.replace(/\s+/g, ' ').trim()
  if (!cleanedLine || isPdfHeaderLine(cleanedLine)) return null

  const match = cleanedLine.match(PDF_ROW_REGEX)
  if (!match) return null

  const actividad = match[1].trim()
  const fecha = match[2].trim()
  const resto = match[3].trim()

  if (!ARQ_CODE_REGEX.test(actividad)) return null

  const normalizedResto = normalizeGuaraniText(resto).toUpperCase()
  if (normalizedResto === 'EN CURSO') {
    return {
      actividad,
      fecha,
      tipo: 'En curso',
      nota: '',
      resultado: 'En curso',
    }
  }

  const tokens = resto.split(/\s+/).filter(Boolean)
  if (tokens.length < 2) return null

  const [firstToken, secondToken, ...remainingTokens] = tokens
  if (!firstToken || !secondToken) return null

  if (remainingTokens.length === 0) {
    return {
      actividad,
      fecha,
      tipo: firstToken,
      nota: '',
      resultado: secondToken,
    }
  }

  if (cleanNota(secondToken) !== undefined || /^[A-Za-z]$/.test(secondToken)) {
    return {
      actividad,
      fecha,
      tipo: firstToken,
      nota: secondToken,
      resultado: remainingTokens.join(' '),
    }
  }

  return {
    actividad,
    fecha,
    tipo: `${firstToken} ${secondToken}`,
    nota: '',
    resultado: remainingTokens.join(' '),
  }
}

function extractPdfLines(items: unknown[]): string[] {
  const groupedByY = new Map<number, PdfTextItem[]>()

  for (const item of items) {
    if (!isPdfTextItem(item)) continue
    const y = item.transform[5]
    if (typeof y !== 'number') continue

    const existingY = Array.from(groupedByY.keys()).find(
      (lineY) => Math.abs(lineY - y) <= PDF_Y_TOLERANCE
    )
    const lineKey = existingY ?? y
    const lineItems = groupedByY.get(lineKey) ?? []
    lineItems.push(item)
    groupedByY.set(lineKey, lineItems)
  }

  return Array.from(groupedByY.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([, lineItems]) =>
      lineItems
        .sort((a, b) => a.transform[4] - b.transform[4])
        .map((item) => item.str.trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean)
}

async function parsePdfRows(buffer: ArrayBuffer): Promise<RowData[]> {
  const pdfjs = await getPdfJsModule()
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) })
  const pdf = await loadingTask.promise

  try {
    const rows: RowData[] = []

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber)
      const textContent = await page.getTextContent({
        includeMarkedContent: false,
        disableNormalization: false,
      })

      for (const line of extractPdfLines(textContent.items)) {
        const row = parsePdfLine(line)
        if (row) rows.push(row)
      }
    }

    return rows
  } finally {
    await pdf.destroy()
  }
}

function getHeaderIndexes(row: unknown[]): XlsColumnIndexes | null {
  const headers = row.map((cell) => normalizeGuaraniText(String(cell)).toLowerCase())
  const actividad = headers.indexOf('actividad')
  const fecha = headers.indexOf('fecha')
  if (actividad === -1 || fecha === -1) return null

  return {
    actividad,
    fecha,
    tipo: headers.indexOf('tipo'),
    nota: headers.indexOf('nota'),
    resultado: headers.indexOf('resultado'),
  }
}

function parseRowFromIndexes(row: unknown[], indexes: XlsColumnIndexes): RowData | null {
  const actividad = String(row[indexes.actividad] ?? '').trim()
  const fecha = String(row[indexes.fecha] ?? '').trim()
  if (!actividad || !fecha || !ARQ_CODE_REGEX.test(actividad) || !DATE_REGEX.test(fecha)) return null

  return {
    actividad,
    fecha,
    tipo: indexes.tipo >= 0 ? String(row[indexes.tipo] ?? '').trim() : '',
    nota: indexes.nota >= 0 ? row[indexes.nota] : '',
    resultado: indexes.resultado >= 0 ? String(row[indexes.resultado] ?? '').trim() : '',
  }
}

function parseRowByPattern(row: unknown[]): RowData | null {
  const cells = row.map((cell) => String(cell ?? '').trim())
  const actividadIndex = cells.findIndex((cell) => ARQ_CODE_REGEX.test(cell))
  const fechaIndex = cells.findIndex((cell) => DATE_REGEX.test(cell))
  if (actividadIndex === -1 || fechaIndex === -1) return null

  const actividad = cells[actividadIndex]
  const fecha = cells[fechaIndex]
  const tail = cells
    .filter((cell, index) => index !== actividadIndex && index !== fechaIndex)
    .filter(Boolean)

  const [tipo = '', maybeNota = '', ...remaining] = tail
  if (!tipo) return null

  if (remaining.length === 0) {
    return {
      actividad,
      fecha,
      tipo,
      nota: '',
      resultado: maybeNota,
    }
  }

  if (cleanNota(maybeNota) !== undefined || /^[A-Za-z]$/.test(maybeNota)) {
    return {
      actividad,
      fecha,
      tipo,
      nota: maybeNota,
      resultado: remaining.join(' '),
    }
  }

  return {
    actividad,
    fecha,
    tipo: `${tipo} ${maybeNota}`.trim(),
    nota: '',
    resultado: remaining.join(' '),
  }
}

function parseRows(sheet: XLSX.WorkSheet): RowData[] {
  const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })
  const rows: RowData[] = []
  let currentIndexes: XlsColumnIndexes | null = null

  for (const sheetRow of json) {
    const row = sheetRow as unknown[]
    const headerIndexes = getHeaderIndexes(row)
    if (headerIndexes) {
      currentIndexes = headerIndexes
      continue
    }

    const parsed = currentIndexes
      ? parseRowFromIndexes(row, currentIndexes)
      : parseRowByPattern(row)

    if (parsed) {
      rows.push(parsed)
    }
  }

  return rows
}

function buildMateriasDesdeRows(rows: RowData[]): GuaraniMateria[] {
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

    const mapped = GUARANI_CODE_MAP[code]
    const materiaIds: (string | null)[] = mapped == null
      ? [null]
      : Array.isArray(mapped) ? mapped : [mapped]

    for (const materiaId of materiaIds) {
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
  }

  // Deduplicar por materiaId: si el plan viejo y el nuevo registran la misma materia,
  // conservar la entrada con el estado de mayor prioridad.
  const deduped = new Map<string | null, GuaraniMateria>()
  for (const m of materias) {
    const existing = deduped.get(m.materiaId)
    if (!existing || ESTADO_PRIORIDAD[m.estadoDetectado] > ESTADO_PRIORIDAD[existing.estadoDetectado]) {
      deduped.set(m.materiaId, m)
    }
  }

  return Array.from(deduped.values())
}

export async function parsearArchivoGuarani(
  buffer: ArrayBuffer,
  fileType: GuaraniFileType = 'xls'
): Promise<GuaraniMateria[]> {
  const rows =
    fileType === 'pdf'
      ? await parsePdfRows(buffer)
      : (() => {
          const data = new Uint8Array(buffer)
          const workbook = XLSX.read(data, { type: 'array', cellDates: false })
          const sheetName = workbook.SheetNames[0]
          if (!sheetName) return []

          const sheet = workbook.Sheets[sheetName]
          return parseRows(sheet)
        })()

  return buildMateriasDesdeRows(rows)
}
