'use client'

import { useState } from 'react'
import { Materia, MateriaEstado, Estado } from '@/lib/types'
import { ESTADO_LABELS, ESTADO_COLORS } from '@/lib/estado-utils'
import { validarCorrelatividades } from '@/lib/logic/correlatividades'
import { getVencimientoInfo } from '@/lib/logic/vencimientos'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EstadoMenu } from './EstadoMenu'
import { NotaModal } from './NotaModal'
import { CorrelativaWarning } from './CorrelativaWarning'

const ESTADOS_CON_DATOS: Estado[] = ['regular_vigente', 'promocionada', 'final_aprobado']

interface MateriaCardProps {
  materia: Materia
  estado: MateriaEstado | undefined
  allEstados: Record<string, MateriaEstado>
  onActualizarEstado: (materiaId: string, data: Partial<MateriaEstado>) => Promise<void>
}

export function MateriaCard({
  materia,
  estado,
  allEstados,
  onActualizarEstado,
}: MateriaCardProps) {
  const estadoActual = estado?.estado ?? 'sin_cursar'
  const colors = ESTADO_COLORS[estadoActual]
  const label = ESTADO_LABELS[estadoActual]

  const [pendingEstado, setPendingEstado] = useState<Estado | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [showNotaModal, setShowNotaModal] = useState(false)
  const [warningFaltantes, setWarningFaltantes] = useState<
    { nombre: string; condicion: 'aprobada' | 'regularizada' }[]
  >([])

  const skipModal = materia.id === 'curso_ingreso'

  function proceedWithEstado(nuevoEstado: Estado) {
    if (!skipModal && ESTADOS_CON_DATOS.includes(nuevoEstado)) {
      setShowNotaModal(true)
    } else {
      onActualizarEstado(materia.id, { estado: nuevoEstado })
      setPendingEstado(null)
    }
  }

  function handleEstadoSelect(nuevoEstado: Estado) {
    setPendingEstado(nuevoEstado)

    if (nuevoEstado === 'sin_cursar') {
      onActualizarEstado(materia.id, {
        estado: nuevoEstado,
        nota: undefined,
        anio_cursado: undefined,
        cuatrimestre: undefined,
      })
      setPendingEstado(null)
      return
    }

    const estadoMap: Record<string, Estado> = {}
    for (const [id, e] of Object.entries(allEstados)) {
      estadoMap[id] = e.estado
    }

    const { cumple, faltantes } = validarCorrelatividades(materia.id, estadoMap)

    if (!cumple) {
      setWarningFaltantes(faltantes)
      setShowWarning(true)
    } else {
      proceedWithEstado(nuevoEstado)
    }
  }

  function handleWarningConfirm() {
    setShowWarning(false)
    if (pendingEstado) {
      proceedWithEstado(pendingEstado)
    }
  }

  function handleNotaConfirm(data: {
    anio_cursado: number
    cuatrimestre?: 1 | 2
    nota?: number
    intentos_previos?: number
  }) {
    if (pendingEstado) {
      onActualizarEstado(materia.id, { estado: pendingEstado, ...data })
    }
    setPendingEstado(null)
    setShowNotaModal(false)
  }

  const vencInfo =
    estadoActual === 'regular_vigente' && estado?.vencimiento_regularidad
      ? getVencimientoInfo(estado.vencimiento_regularidad)
      : null

  const vencBadgeColors: Record<string, string> = {
    ok: 'bg-emerald-500',
    warning: 'bg-yellow-400',
    danger: 'bg-red-500 animate-pulse',
    expired: 'bg-gray-400',
  }

  return (
    <>
      <EstadoMenu estadoActual={estadoActual} onSelect={handleEstadoSelect}>
        <button
          className="relative w-full rounded-lg border p-3 text-left transition-colors duration-150 ease-in-out hover:opacity-90"
          style={{ backgroundColor: colors.bg, color: colors.fg }}
        >
          {/* Vencimiento badge */}
          {vencInfo && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full ${vencBadgeColors[vencInfo.estado]}`}
                />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">{vencInfo.label}</p>
              </TooltipContent>
            </Tooltip>
          )}

          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{materia.nombre}</p>
              <p className="mt-0.5 text-xs opacity-70">{materia.horasCatedra} hs</p>
            </div>
            {estado?.nota != null && (
              <span className="text-2xl font-bold leading-none">{estado.nota}</span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <Badge
              variant="outline"
              className="border-current text-xs"
              style={{ color: colors.fg }}
            >
              {label}
            </Badge>
            {estado?.anio_cursado && (
              <span className="text-xs opacity-60">
                {estado.anio_cursado}
                {estado.cuatrimestre ? ` · ${estado.cuatrimestre}°C` : ''}
              </span>
            )}
          </div>
          {/* Vencimiento inline (fallback para touch, siempre visible cuando es urgente) */}
          {vencInfo && vencInfo.estado !== 'ok' && (
            <p
              className={`mt-1.5 text-xs font-medium ${
                vencInfo.estado === 'expired'
                  ? 'opacity-60'
                  : vencInfo.estado === 'danger'
                    ? 'text-red-600'
                    : 'text-yellow-600'
              }`}
            >
              {vencInfo.label}
            </p>
          )}
        </button>
      </EstadoMenu>

      <CorrelativaWarning
        open={showWarning}
        onOpenChange={setShowWarning}
        faltantes={warningFaltantes}
        onConfirm={handleWarningConfirm}
      />

      <NotaModal
        open={showNotaModal}
        onOpenChange={(open) => {
          setShowNotaModal(open)
          if (!open) setPendingEstado(null)
        }}
        estado={pendingEstado ?? estadoActual}
        materiaName={materia.nombre}
        initialData={estado}
        onConfirm={handleNotaConfirm}
      />
    </>
  )
}
