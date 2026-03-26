import { NextResponse } from 'next/server'

export interface FeriadoFAU {
  date: string
  text: string
}

export interface PeriodoFAU {
  start: string
  end: string
  text: string
}

export interface EspecialFAU {
  date?: string
  start?: string
  end?: string
  text: string | string[]
}

export interface CalendarioFAUData {
  anio: number
  feriados: FeriadoFAU[]
  inscripciones: PeriodoFAU[]
  mesas: PeriodoFAU[]
  especiales: EspecialFAU[]
  recuperatorios: PeriodoFAU[]
  recesos: PeriodoFAU[]
  source: 'scraper' | 'fallback'
  scrapedAt: string
}

export const revalidate = 86400 // 24hs

export async function GET(
  _request: Request,
  { params }: { params: { year: string } }
) {
  const year = parseInt(params.year, 10)

  if (isNaN(year) || year < 2026 || year > 2030) {
    return NextResponse.json({ error: 'Año inválido' }, { status: 400 })
  }

  try {
    const html = await fetch('https://www.arq.unne.edu.ar/calendario-academico/', {
      next: { revalidate: 86400 },
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FAUU-Tracker/1.0)' },
    }).then((r) => r.text())

    const data = extractDataFromHTML(html, year)

    if (!data) {
      return NextResponse.json(
        { error: `No se encontraron datos del calendario ${year} en la página de la FAU.` },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[calendario-fau] Error al scrapear:', err)
    return NextResponse.json(
      { error: 'No se pudo conectar con el sitio de la FAU.' },
      { status: 502 }
    )
  }
}

function extractDataFromHTML(html: string, year: number): CalendarioFAUData | null {
  // Buscar el bloque const DATA = { ... } — el objeto puede terminar antes de varias palabras clave
  // Estrategia: encontrar "const DATA =" y luego extraer hasta la llave de cierre balanceada
  const dataStart = html.indexOf('const DATA =')
  if (dataStart === -1) return null

  // Buscar la apertura del objeto
  const braceStart = html.indexOf('{', dataStart)
  if (braceStart === -1) return null

  // Recorrer balanceando llaves para encontrar el cierre
  let depth = 0
  let braceEnd = -1
  for (let i = braceStart; i < html.length; i++) {
    if (html[i] === '{') depth++
    else if (html[i] === '}') {
      depth--
      if (depth === 0) { braceEnd = i; break }
    }
  }
  if (braceEnd === -1) return null

  const rawStr = html.slice(braceStart, braceEnd + 1)

  let raw: Record<string, unknown>
  try {
    // eslint-disable-next-line no-new-func
    raw = new Function(`return (${rawStr})`)() as Record<string, unknown>
  } catch {
    return null
  }

  // Verificar que haya al menos datos de mesas con el año buscado
  const mesas = raw.mesas as Array<{ start: string; end: string; text: string }> | undefined
  if (!mesas?.length) return null

  const firstMesaYear = parseInt(mesas[0].start?.slice(0, 4) ?? '0', 10)
  if (firstMesaYear !== year) return null

  // Normalizar especiales que pueden tener text como string o string[]
  const especiales = (raw.especiales as EspecialFAU[] ?? []).map((e) => ({
    ...e,
    text: Array.isArray(e.text) ? e.text.join(' ') : e.text,
  }))

  return {
    anio: year,
    feriados: (raw.feriados as FeriadoFAU[]) ?? [],
    inscripciones: (raw.inscripciones as PeriodoFAU[]) ?? [],
    mesas: mesas ?? [],
    especiales,
    recuperatorios: (raw.recuperatorios as PeriodoFAU[]) ?? [],
    recesos: (raw.recesos as PeriodoFAU[]) ?? [],
    source: 'scraper',
    scrapedAt: new Date().toISOString(),
  }
}
