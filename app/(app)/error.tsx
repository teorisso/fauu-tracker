'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function AppSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app/section-error]', error)
  }, [error])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive/50" strokeWidth={1.5} />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Error al cargar esta sección</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Ocurrió un problema al cargar el contenido. Podés intentar de nuevo o ir a otra sección.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono">{error.digest}</p>
        )}
      </div>

      <Button variant="outline" onClick={reset}>
        Reintentar
      </Button>
    </div>
  )
}
