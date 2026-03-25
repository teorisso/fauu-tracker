'use client'

import { useFormStatus } from 'react-dom'
import { signOut } from '@/app/(auth)/login/actions'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SubmitButtonProps {
  compact?: boolean
}

function SubmitButton({ compact }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={pending}
            className="h-8 w-8 shrink-0"
            aria-label="Cerrar sesión"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Cerrar sesión</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Button variant="ghost" size="sm" disabled={pending} className="w-full justify-start gap-2">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      Cerrar sesión
    </Button>
  )
}

interface LogoutButtonProps {
  compact?: boolean
}

export function LogoutButton({ compact }: LogoutButtonProps) {
  return (
    <form action={signOut}>
      <SubmitButton compact={compact} />
    </form>
  )
}
