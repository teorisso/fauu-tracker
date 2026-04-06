'use client'

import { useEffect, useState, useCallback } from 'react'
import { Logro } from '@/lib/types'
import { X, Share2, CheckCircle2 } from 'lucide-react'

// ── Toast de logro desbloqueado ─────────────────────────────────────────────

interface LogroToastProps {
  logro: Logro
  onClose: () => void
  onCompartir?: (logro: Logro) => void
}

export function LogroToast({ logro, onClose, onCompartir }: LogroToastProps) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  const handleClose = useCallback(() => {
    setExiting(true)
    setTimeout(() => onClose(), 300)
  }, [onClose])

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })

    const timer = setTimeout(() => {
      handleClose()
    }, 6000)

    return () => clearTimeout(timer)
  }, [handleClose])

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-background px-4 py-3 shadow-lg transition-all duration-300 ${
        visible && !exiting
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-4 opacity-0 scale-95'
      }`}
    >
      {/* Emoji badge */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--estado-promocionada-bg))] text-xl animate-bounce-once">
        {logro.emoji}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[hsl(var(--estado-final-aprobado-bg))]">
          ¡Nuevo logro desbloqueado!
        </p>
        <p className="text-sm font-semibold">{logro.nombre}</p>
        <p className="text-xs text-muted-foreground leading-snug">
          {logro.descripcion}
        </p>
        {onCompartir && (
          <button
            onClick={() => {
              onCompartir(logro)
              handleClose()
            }}
            className="mt-1.5 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <Share2 className="h-3 w-3" />
            Compartir en stories
          </button>
        )}
      </div>

      {/* Close */}
      <button
        onClick={handleClose}
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
        aria-label="Cerrar"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ── Toast de materia aprobada ────────────────────────────────────────────────

export interface MateriaAprobadaInfo {
  /** ID único para el toast (usar materiaId) */
  id: string
  nombre: string
  nota?: number
  esPromocion?: boolean
}

interface MateriaAprobadaToastProps {
  materia: MateriaAprobadaInfo
  onClose: () => void
  onCompartir?: (materia: MateriaAprobadaInfo) => void
}

export function MateriaAprobadaToast({
  materia,
  onClose,
  onCompartir,
}: MateriaAprobadaToastProps) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  const handleClose = useCallback(() => {
    setExiting(true)
    setTimeout(() => onClose(), 300)
  }, [onClose])

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })

    const timer = setTimeout(() => {
      handleClose()
    }, 8000) // más tiempo para que el usuario pueda compartir

    return () => clearTimeout(timer)
  }, [handleClose])

  const label = materia.esPromocion ? '¡Materia promocionada!' : '¡Materia aprobada!'

  return (
    <div
      className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border shadow-lg transition-all duration-300 ${
        visible && !exiting
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-4 opacity-0 scale-95'
      }`}
    >
      {/* Franja de acento verde */}
      <div className="h-1 w-full bg-[hsl(var(--estado-final-aprobado-bg))]" />

      <div className="flex items-start gap-3 bg-background px-4 py-3">
        {/* Ícono */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--estado-final-aprobado-bg))]/10">
          <CheckCircle2 className="h-5 w-5 text-[hsl(var(--estado-final-aprobado-bg))]" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[hsl(var(--estado-final-aprobado-bg))]">
            {label}
          </p>
          <p className="text-sm font-semibold truncate">{materia.nombre}</p>
          {materia.nota != null && (
            <p className="text-xs text-muted-foreground">
              Nota: <span className="font-medium text-foreground">{materia.nota}</span>
            </p>
          )}
          {onCompartir && (
            <button
              onClick={() => {
                onCompartir(materia)
                handleClose()
              }}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--estado-final-aprobado-bg))]/30 bg-[hsl(var(--estado-final-aprobado-bg))]/8 px-3 py-1.5 text-xs font-semibold text-[hsl(var(--estado-final-aprobado-bg))] hover:bg-[hsl(var(--estado-final-aprobado-bg))]/15 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
              Compartir en Stories 📱
            </button>
          )}
        </div>

        {/* Close */}
        <button
          onClick={handleClose}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Containers ───────────────────────────────────────────────────────────────

/** Container que apila múltiples toasts de logros */
interface LogroToastContainerProps {
  logros: Logro[]
  onDismiss: (id: string) => void
  onCompartir?: (logro: Logro) => void
}

export function LogroToastContainer({ logros, onDismiss, onCompartir }: LogroToastContainerProps) {
  if (logros.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2 items-end pointer-events-none">
      {logros.map((logro) => (
        <LogroToast
          key={logro.id}
          logro={logro}
          onClose={() => onDismiss(logro.id)}
          onCompartir={onCompartir}
        />
      ))}
    </div>
  )
}

/** Container para toasts de materias aprobadas */
interface MateriaToastContainerProps {
  materias: MateriaAprobadaInfo[]
  onDismiss: (id: string) => void
  onCompartir?: (materia: MateriaAprobadaInfo) => void
}

export function MateriaToastContainer({ materias, onDismiss, onCompartir }: MateriaToastContainerProps) {
  if (materias.length === 0) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-4 sm:right-auto z-50 flex flex-col gap-2 items-start pointer-events-none">
      {materias.map((m) => (
        <MateriaAprobadaToast
          key={m.id}
          materia={m}
          onClose={() => onDismiss(m.id)}
          onCompartir={onCompartir}
        />
      ))}
    </div>
  )
}
