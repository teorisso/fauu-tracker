import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scrapeMesasFAU } from '@/lib/logic/mesasScraper'
import type { TurnoExamen, MesaExamen } from '@/lib/data/calendario-academico'

export interface MesasFAUData {
  anio: number
  turnos: TurnoExamen[]
  mesas: MesaExamen[]
  scrapedAt: string
}

export const revalidate = 86400 // 24 horas

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const data = await scrapeMesasFAU()
    const response: MesasFAUData = {
      ...data,
      scrapedAt: new Date().toISOString(),
    }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[mesas-fau] Error al scrapear turno-examenes:', err)
    return NextResponse.json(
      { error: 'No se pudo obtener el cronograma de mesas de la FAU.' },
      { status: 502 }
    )
  }
}
