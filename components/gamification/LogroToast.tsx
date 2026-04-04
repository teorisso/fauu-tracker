'use client'

import { useEffect, useState, useCallback } from 'react'
import { Logro } from '@/lib/types'
import { X, Share2 } from 'lucide-react'

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
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-background px-4 py-3 shadow-lg transition-all duration-300 ${
        visible && !exiting
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-4 opacity-0 scale-95'
      }`}
    >
      {/* Emoji badge */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--estado-promocionada-bg))] text-xl animate-bounce-once">
        {logro.emoji}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[hsl(var(--estado-final-aprobado-bg))]">
          ¡Nuevo logro!
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
            className="mt-1.5 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <Share2 className="h-3 w-3" />
            Compartir
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

/** Container que apila múltiples toasts */
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
