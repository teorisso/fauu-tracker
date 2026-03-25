'use client'

import { useState } from 'react'
import { Seminario, AreaSeminario, Estado } from '@/lib/types'
import { ESTADO_LABELS, ESTADO_COLORS } from '@/lib/estado-utils'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { EstadoMenu } from '@/components/materias/EstadoMenu'
import { NotaModal } from '@/components/materias/NotaModal'
import { ChevronDown } from 'lucide-react'

const AREA_LABELS: Record<AreaSeminario, string> = {
  tecnologia_produccion_gestion: 'Tecnología, Producción y Gestión',
  proyecto_planeamiento: 'Proyecto y Planeamiento',
  comunicacion_forma: 'Comunicación y Forma',
  ciencias_sociales_humanas: 'Ciencias Sociales y Humanas',
}

const ESTADOS_CON_DATOS: Estado[] = ['regular_vigente', 'promocionada', 'final_aprobado']

interface SeminarioCardProps {
  seminario: Seminario
  onUpdate?: (datos: Partial<Seminario>) => void
}

export function SeminarioCard({ seminario, onUpdate }: SeminarioCardProps) {
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(seminario.nombre ?? '')
  const [showNotaModal, setShowNotaModal] = useState(false)
  const [pendingEstado, setPendingEstado] = useState<Estado | null>(null)
  const [areaOpen, setAreaOpen] = useState(false)

  const colors = ESTADO_COLORS[seminario.estado]
  const label = ESTADO_LABELS[seminario.estado]
  const displayName = seminario.nombre || `Seminario Optativo ${seminario.numero}`

  function handleNameBlur() {
    setEditingName(false)
    if (nameValue !== (seminario.nombre ?? '')) {
      onUpdate?.({ nombre: nameValue || undefined })
    }
  }

  function handleEstadoSelect(nuevoEstado: Estado) {
    setPendingEstado(nuevoEstado)

    if (nuevoEstado === 'sin_cursar') {
      onUpdate?.({ estado: nuevoEstado, nota: undefined, anio_cursado: undefined, cuatrimestre: undefined })
      setPendingEstado(null)
      return
    }

    if (ESTADOS_CON_DATOS.includes(nuevoEstado)) {
      setShowNotaModal(true)
    } else {
      onUpdate?.({ estado: nuevoEstado })
      setPendingEstado(null)
    }
  }

  function handleNotaConfirm(data: {
    anio_cursado: number
    cuatrimestre?: 1 | 2
    nota?: number
    intentos_previos?: number
  }) {
    if (pendingEstado) {
      onUpdate?.({ estado: pendingEstado, ...data })
    }
    setPendingEstado(null)
    setShowNotaModal(false)
  }

  return (
    <>
      <div
        className="overflow-hidden rounded-lg border p-3 transition-colors duration-150"
        style={{ backgroundColor: colors.bg, color: colors.fg }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 overflow-hidden">
            {editingName ? (
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
                autoFocus
                className="h-7 border-current bg-transparent px-1 text-sm font-medium"
                placeholder="Nombre del seminario"
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="line-clamp-2 w-full text-left text-sm font-medium hover:underline"
              >
                {displayName}
              </button>
            )}
            {seminario.area ? (
              <p className="mt-0.5 truncate text-xs opacity-70">
                {AREA_LABELS[seminario.area]}
              </p>
            ) : (
              <Popover open={areaOpen} onOpenChange={setAreaOpen}>
                <PopoverTrigger asChild>
                  <button className="mt-1 flex items-center gap-1 rounded border border-current/30 px-1.5 py-0.5 text-xs opacity-70 hover:opacity-100 transition-opacity">
                    Seleccionar área
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-1" align="start">
                  {Object.entries(AREA_LABELS).map(([key, areaLabel]) => (
                    <button
                      key={key}
                      onClick={() => {
                        onUpdate?.({ area: key as AreaSeminario })
                        setAreaOpen(false)
                      }}
                      className="w-full rounded px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                    >
                      {areaLabel}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            )}
          </div>
          {seminario.nota != null && (
            <span className="ml-2 shrink-0 text-2xl font-bold leading-none">{seminario.nota}</span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <EstadoMenu estadoActual={seminario.estado} onSelect={handleEstadoSelect}>
            <button className="cursor-pointer">
              <Badge
                variant="outline"
                className="border-current text-xs hover:opacity-80"
                style={{ color: colors.fg }}
              >
                {label}
              </Badge>
            </button>
          </EstadoMenu>
          {seminario.anio_cursado && (
            <span className="text-xs opacity-60">
              {seminario.anio_cursado}
              {seminario.cuatrimestre ? ` · ${seminario.cuatrimestre}°C` : ''}
            </span>
          )}
        </div>
      </div>

      <NotaModal
        open={showNotaModal}
        onOpenChange={(open) => {
          setShowNotaModal(open)
          if (!open) setPendingEstado(null)
        }}
        estado={pendingEstado ?? seminario.estado}
        materiaName={displayName}
        initialData={seminario}
        onConfirm={handleNotaConfirm}
      />
    </>
  )
}
