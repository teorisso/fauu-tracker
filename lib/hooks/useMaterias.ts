'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MateriaEstado, Seminario, Estado } from '@/lib/types'

export interface UseMateriasReturn {
  estados: Record<string, MateriaEstado>
  seminarios: Seminario[]
  isLoading: boolean
  actualizarEstado: (
    materiaId: string,
    nuevoEstado: Partial<MateriaEstado>
  ) => Promise<void>
  actualizarSeminario: (
    numero: number,
    datos: Partial<Seminario>
  ) => Promise<void>
}

function completarSeminarios(initial: Seminario[]): Seminario[] {
  const result: Seminario[] = []
  for (const n of [1, 2, 3] as const) {
    const existing = initial.find((s) => s.numero === n)
    result.push(
      existing ?? { numero: n, estado: 'sin_cursar' as Estado }
    )
  }
  return result
}

export function useMaterias(
  initialEstados: Record<string, MateriaEstado>,
  initialSeminarios: Seminario[],
  userId: string
): UseMateriasReturn {
  const [estados, setEstados] = useState(initialEstados)
  const [seminarios, setSeminarios] = useState(() =>
    completarSeminarios(initialSeminarios)
  )
  const [isLoading] = useState(false)

  const actualizarEstado = useCallback(
    async (materiaId: string, nuevoEstado: Partial<MateriaEstado>) => {
      const anterior = estados[materiaId]
      const defaults: MateriaEstado = {
        materia_id: materiaId,
        estado: 'sin_cursar',
        intentos_previos: 0,
      }
      const actualizado: MateriaEstado = {
        ...defaults,
        ...anterior,
        ...nuevoEstado,
        materia_id: materiaId,
      }

      setEstados((prev) => ({ ...prev, [materiaId]: actualizado }))

      try {
        const supabase = createClient()
        const { error } = await supabase.from('materia_estados').upsert(
          {
            user_id: userId,
            materia_id: materiaId,
            estado: actualizado.estado,
            anio_cursado: actualizado.anio_cursado ?? null,
            cuatrimestre: actualizado.cuatrimestre ?? null,
            nota: actualizado.nota ?? null,
            intentos_previos: actualizado.intentos_previos,
          },
          { onConflict: 'user_id,materia_id' }
        )
        if (error) throw error
      } catch (err) {
        console.error('Error sincronizando estado:', err)
        setEstados((prev) => {
          if (anterior) return { ...prev, [materiaId]: anterior }
          const copy = { ...prev }
          delete copy[materiaId]
          return copy
        })
      }
    },
    [estados, userId]
  )

  const actualizarSeminario = useCallback(
    async (numero: number, datos: Partial<Seminario>) => {
      const idx = seminarios.findIndex((s) => s.numero === numero)
      if (idx === -1) return
      const anterior = seminarios[idx]
      const actualizado: Seminario = { ...anterior, ...datos }

      setSeminarios((prev) => {
        const copy = [...prev]
        copy[idx] = actualizado
        return copy
      })

      try {
        const supabase = createClient()
        const { error } = await supabase.from('seminarios').upsert(
          {
            user_id: userId,
            numero: actualizado.numero,
            nombre: actualizado.nombre ?? null,
            area: actualizado.area ?? null,
            estado: actualizado.estado,
            anio_cursado: actualizado.anio_cursado ?? null,
            cuatrimestre: actualizado.cuatrimestre ?? null,
            nota: actualizado.nota ?? null,
          },
          { onConflict: 'user_id,numero' }
        )
        if (error) throw error
      } catch (err) {
        console.error('Error sincronizando seminario:', err)
        setSeminarios((prev) => {
          const copy = [...prev]
          copy[idx] = anterior
          return copy
        })
      }
    },
    [seminarios, userId]
  )

  return { estados, seminarios, isLoading, actualizarEstado, actualizarSeminario }
}
