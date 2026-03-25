'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle } from 'lucide-react'

interface CorrelativaWarningProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  faltantes: { nombre: string; condicion: 'aprobada' | 'regularizada' }[]
  onConfirm: () => void
}

export function CorrelativaWarning({
  open,
  onOpenChange,
  faltantes,
  onConfirm,
}: CorrelativaWarningProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Correlativas pendientes
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <p className="mb-2">
                No se cumplen todas las correlativas para esta materia:
              </p>
              <ul className="space-y-1 rounded-md border border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-700 dark:bg-yellow-950/30">
                {faltantes.map((f, i) => (
                  <li key={i} className="text-sm text-yellow-800 dark:text-yellow-300">
                    Falta: <strong>{f.nombre}</strong> ({f.condicion})
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm">
                Podés guardar igual, esto es solo una advertencia.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Guardar igual
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
