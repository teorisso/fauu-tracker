'use client'

import { useMemo } from 'react'
import { MateriaEstado } from '@/lib/types'
import { sugerirProximosExamenes, type SugerenciaExamen } from '@/lib/logic/planificacion'
import Link from 'next/link'
import { CalendarDays, AlertTriangle, TrendingUp } from 'lucide-react'

interface ProximosExamenesProps {
  estados: Record<string, MateriaEstado>
}

const URGENCIA_CONFIG = {
  critica: {
    icon: <AlertTriangle className="h-3 w-3 text-red-500" />,
    textClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
  },
  alta: {
    icon: <TrendingUp className="h-3 w-3 text-yellow-500" />,
    textClass: 'text-yellow-700 dark:text-yellow-400',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
  },
  normal: {
    icon: <CalendarDays className="h-3 w-3 text-blue-500" />,
    textClass: 'text-blue-700 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
  },
}

function formatFechaCorta(iso: string): string {
  const [, m, d] = iso.split('-')
  const meses = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${parseInt(d)} ${meses[parseInt(m)]}`
}

export function ProximosExamenes({ estados }: ProximosExamenesProps) {
  const sugerencias = useMemo(() => sugerirProximosExamenes(estados), [estados])

  if (sugerencias.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Próximos exámenes</span>
        <Link href="/calendario" className="text-xs text-blue-600 hover:underline">
          Ver calendario
        </Link>
      </div>
      <div className="space-y-1.5">
        {sugerencias.map((s: SugerenciaExamen) => {
          const config = URGENCIA_CONFIG[s.urgencia]
          return (
            <div
              key={s.materiaId}
              className={`rounded-md border p-2 text-xs ${config.bgClass}`}
            >
              <div className="flex items-start gap-1.5">
                {config.icon}
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-tight" title={s.nombre}>
                    {s.nombre}
                  </p>
                  <p className={`mt-0.5 ${config.textClass}`}>
                    {s.turno.numero}° Turno · {formatFechaCorta(s.fechaMesa)}
                  </p>
                  <p className="text-muted-foreground">{s.razon}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
