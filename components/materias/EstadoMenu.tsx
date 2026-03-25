'use client'

import { useState } from 'react'
import { Estado } from '@/lib/types'
import { ESTADOS_ORDENADOS, ESTADO_LABELS, ESTADO_COLORS } from '@/lib/estado-utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check } from 'lucide-react'

interface EstadoMenuProps {
  estadoActual: Estado
  onSelect: (estado: Estado) => void
  children: React.ReactNode
}

export function EstadoMenu({ estadoActual, onSelect, children }: EstadoMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        {ESTADOS_ORDENADOS.map((estado) => {
          const colors = ESTADO_COLORS[estado]
          const isSelected = estado === estadoActual
          return (
            <button
              key={estado}
              onClick={() => {
                onSelect(estado)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
            >
              <div
                className="h-3 w-3 shrink-0 rounded-sm border"
                style={{ backgroundColor: colors.bg, borderColor: colors.fg }}
              />
              <span className="flex-1">{ESTADO_LABELS[estado]}</span>
              {isSelected && <Check className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
