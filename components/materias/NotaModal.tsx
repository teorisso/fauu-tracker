'use client'

import { useState, useEffect } from 'react'
import { Estado } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NotaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  estado: Estado
  materiaName: string
  initialData?: {
    anio_cursado?: number
    cuatrimestre?: 1 | 2
    nota?: number
    intentos_previos?: number
  }
  onConfirm: (data: {
    anio_cursado: number
    cuatrimestre?: 1 | 2
    nota?: number
    intentos_previos?: number
  }) => void
}

const requiresNota = (estado: Estado) =>
  estado === 'final_aprobado' || estado === 'promocionada'

export function NotaModal({
  open,
  onOpenChange,
  estado,
  materiaName,
  initialData,
  onConfirm,
}: NotaModalProps) {
  const [anio, setAnio] = useState<string>(
    initialData?.anio_cursado?.toString() ?? ''
  )
  const [cuatrimestre, setCuatrimestre] = useState<1 | 2 | 'anual' | null>(
    initialData?.cuatrimestre ?? null
  )
  const [nota, setNota] = useState<string>(
    initialData?.nota?.toString() ?? ''
  )
  const [intentos, setIntentos] = useState<string>(
    initialData?.intentos_previos?.toString() ?? '0'
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setAnio(initialData?.anio_cursado?.toString() ?? '')
      setCuatrimestre(
        initialData?.cuatrimestre
          ? initialData.cuatrimestre
          : initialData?.anio_cursado
            ? 'anual'
            : null
      )
      setNota(initialData?.nota?.toString() ?? '')
      setIntentos(initialData?.intentos_previos?.toString() ?? '0')
      setErrors({})
    }
  }, [open, initialData])

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    const anioNum = parseInt(anio)
    if (!anio || isNaN(anioNum) || anioNum < 2015 || anioNum > 2030) {
      newErrors.anio = 'Ingresá un año entre 2015 y 2030'
    }

    if (!cuatrimestre) {
      newErrors.cuatrimestre = 'Seleccioná cuatrimestre o anual'
    }

    if (requiresNota(estado)) {
      const notaNum = parseFloat(nota)
      if (!nota || isNaN(notaNum) || notaNum < 1 || notaNum > 10) {
        newErrors.nota = 'Ingresá una nota entre 1 y 10'
      }
    } else if (nota) {
      const notaNum = parseFloat(nota)
      if (isNaN(notaNum) || notaNum < 1 || notaNum > 10) {
        newErrors.nota = 'La nota debe estar entre 1 y 10'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleConfirm() {
    if (!validate()) return

    const data: {
      anio_cursado: number
      cuatrimestre?: 1 | 2
      nota?: number
      intentos_previos?: number
    } = {
      anio_cursado: parseInt(anio),
      cuatrimestre: cuatrimestre === 'anual' ? undefined : cuatrimestre!,
    }

    if (nota) {
      data.nota = parseFloat(nota)
    }

    if (estado === 'final_aprobado' && intentos) {
      data.intentos_previos = parseInt(intentos)
    }

    onConfirm(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{materiaName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Año cursado */}
          <div className="space-y-1.5">
            <Label htmlFor="anio">Año cursado</Label>
            <Input
              id="anio"
              type="number"
              min={2015}
              max={2030}
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              placeholder="2024"
            />
            {errors.anio && (
              <p className="text-xs text-destructive">{errors.anio}</p>
            )}
          </div>

          {/* Cuatrimestre */}
          <div className="space-y-1.5">
            <Label>Período</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={cuatrimestre === 1 ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setCuatrimestre(1)}
              >
                1° cuat.
              </Button>
              <Button
                type="button"
                variant={cuatrimestre === 2 ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setCuatrimestre(2)}
              >
                2° cuat.
              </Button>
              <Button
                type="button"
                variant={cuatrimestre === 'anual' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setCuatrimestre('anual')}
              >
                Anual
              </Button>
            </div>
            {errors.cuatrimestre && (
              <p className="text-xs text-destructive">{errors.cuatrimestre}</p>
            )}
          </div>

          {/* Nota */}
          <div className="space-y-1.5">
            <Label htmlFor="nota">
              Nota{requiresNota(estado) ? '' : ' (opcional)'}
            </Label>
            <Input
              id="nota"
              type="number"
              min={1}
              max={10}
              step={0.5}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="8"
            />
            {errors.nota && (
              <p className="text-xs text-destructive">{errors.nota}</p>
            )}
          </div>

          {/* Intentos previos (solo final_aprobado) */}
          {estado === 'final_aprobado' && (
            <div className="space-y-1.5">
              <Label htmlFor="intentos">Intentos previos en final</Label>
              <Input
                id="intentos"
                type="number"
                min={0}
                max={20}
                value={intentos}
                onChange={(e) => setIntentos(e.target.value)}
              />
              <p className="text-xs text-muted-foreground italic">
                Los intentos son solo informativos y no afectan el promedio
                calculado
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
