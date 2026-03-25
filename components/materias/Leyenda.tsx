import { ESTADOS_ORDENADOS, ESTADO_LABELS, ESTADO_COLORS } from '@/lib/estado-utils'

export function Leyenda() {
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Estados
      </h3>
      {ESTADOS_ORDENADOS.map((estado) => (
        <div key={estado} className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: ESTADO_COLORS[estado].bg }}
          />
          <span className="text-xs text-muted-foreground">
            {ESTADO_LABELS[estado]}
          </span>
        </div>
      ))}
    </div>
  )
}
