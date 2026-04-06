'use client'

import { useMemo } from 'react'
import { MateriaEstado, Seminario, LogroDesbloqueado, LogroCategoria } from '@/lib/types'
import { calcularLogros } from '@/lib/logic/logros'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Share2 } from 'lucide-react'

interface LogrosPanelProps {
  estados: Record<string, MateriaEstado>
  seminarios: Seminario[]
  compacto?: boolean
  onCompartirLogro?: (logro: LogroDesbloqueado) => void
}

const CATEGORIA_LABELS: Record<LogroCategoria, string> = {
  anio: 'Por año',
  cantidad: 'Por cantidad',
  ciclo: 'Por ciclo',
  especial: 'Especiales',
}

const CATEGORIA_ORDER: LogroCategoria[] = ['cantidad', 'anio', 'ciclo', 'especial']

export function LogrosPanel({ estados, seminarios, compacto = false, onCompartirLogro }: LogrosPanelProps) {
  const logros = useMemo(() => calcularLogros(estados, seminarios), [estados, seminarios])

  const desbloqueados = logros.filter((l) => l.desbloqueado).length
  const total = logros.length

  const logrosPorCategoria = useMemo(() => {
    const map = new Map<LogroCategoria, LogroDesbloqueado[]>()
    for (const cat of CATEGORIA_ORDER) {
      map.set(cat, [])
    }
    for (const l of logros) {
      const arr = map.get(l.logro.categoria)
      if (arr) arr.push(l)
    }
    return map
  }, [logros])

  if (compacto) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Logros</span>
          <span className="text-xs font-medium">
            {desbloqueados}/{total}
          </span>
        </div>
        <TooltipProvider delayDuration={200}>
          <div className="flex flex-wrap gap-1">
            {logros.map((l) => (
              <Tooltip key={l.logro.id}>
                <TooltipTrigger asChild>
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-sm transition-all ${l.desbloqueado
                        ? 'bg-[hsl(var(--estado-final-aprobado-bg))] shadow-sm hover:scale-110 cursor-default'
                        : 'bg-muted opacity-40 grayscale cursor-default'
                      }`}
                  >
                    {l.logro.emoji}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <p className="font-semibold text-xs">{l.logro.nombre}</p>
                  <p className="text-xs text-muted-foreground">{l.logro.descripcion}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>
    )
  }

  // Versión expandida (perfil)
  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold">Logros</h3>
        <span className="text-sm text-muted-foreground">
          {desbloqueados} de {total} desbloqueados
        </span>
      </div>

      {/* Barra de progreso de logros */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[hsl(var(--estado-final-aprobado-bg))] transition-all duration-500"
          style={{ width: `${total > 0 ? (desbloqueados / total) * 100 : 0}%` }}
        />
      </div>

      {CATEGORIA_ORDER.map((cat) => {
        const items = logrosPorCategoria.get(cat)
        if (!items || items.length === 0) return null
        return (
          <div key={cat} className="space-y-2">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {CATEGORIA_LABELS[cat]}
            </h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((l) => (
                <div
                  key={l.logro.id}
                  className={`group relative flex items-center gap-2.5 rounded-lg border p-2.5 transition-all ${l.desbloqueado
                      ? 'border-[hsl(var(--estado-final-aprobado-bg))] bg-[hsl(var(--estado-promocionada-bg))]'
                      : 'border-border bg-muted/30 opacity-50 grayscale'
                    }`}
                >
                  <span className="text-xl shrink-0">{l.logro.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{l.logro.nombre}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                      {l.logro.descripcion}
                    </p>
                  </div>
                  {l.desbloqueado && onCompartirLogro && (
                    <button
                      onClick={() => onCompartirLogro(l)}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-background/60 transition-all"
                      title="Compartir logro"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
