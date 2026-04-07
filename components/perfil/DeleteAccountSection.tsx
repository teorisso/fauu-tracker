'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteAccount } from '@/app/(app)/perfil/actions'

const CONFIRM_WORD = 'ELIMINAR'

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isConfirmed = confirmText === CONFIRM_WORD

  function handleOpenChange(val: boolean) {
    if (!val) {
      setConfirmText('')
      setServerError(null)
    }
    setOpen(val)
  }

  function handleDelete() {
    if (!isConfirmed) return
    setServerError(null)
    startTransition(async () => {
      const result = await deleteAccount()
      if (result?.error) {
        setServerError(result.error)
      }
    })
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-destructive flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Zona de peligro
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Las siguientes acciones son irreversibles. Procedé con cuidado.
        </p>
      </div>

      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
        <div>
          <p className="text-sm font-medium">Eliminar mi cuenta</p>
          <p className="text-xs text-muted-foreground mt-1">
            Borra permanentemente tu cuenta y todos los datos asociados: progreso de materias,
            seminarios, notificaciones, mesas anotadas y configuraciones. Esta acción no se
            puede deshacer.
          </p>
        </div>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Eliminar cuenta
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                ¿Eliminar tu cuenta?
              </DialogTitle>
              <DialogDescription className="space-y-2 pt-1">
                <span className="block">
                  Esto eliminará permanentemente:
                </span>
                <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground">
                  <li>Tu perfil y datos de cuenta</li>
                  <li>El estado de todas tus materias y seminarios</li>
                  <li>Tus mesas anotadas y configuraciones</li>
                  <li>Todas tus preferencias de notificación</li>
                </ul>
                <span className="block font-medium text-foreground mt-2">
                  Esta acción no se puede deshacer.
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <Label htmlFor="confirm-delete" className="text-sm">
                Para confirmar, escribí <strong className="text-destructive">{CONFIRM_WORD}</strong>
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_WORD}
                className="font-mono"
                autoComplete="off"
                disabled={isPending}
              />
              {serverError && (
                <p className="text-xs text-destructive">{serverError}</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!isConfirmed || isPending}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {isPending ? 'Eliminando...' : 'Eliminar definitivamente'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
