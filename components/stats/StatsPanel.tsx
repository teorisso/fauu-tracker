'use client'

import { useState } from 'react'
import { MATERIAS, HORAS_TOTALES_OBLIGATORIAS } from '@/lib/data/materias'
import { MateriaEstado, UserProfile, Estado, Ciclo, Seminario } from '@/lib/types'
import { calcularPromedio, calcularHorasAcreditadas } from '@/lib/logic/promedios'
import { calcularProyeccion } from '@/lib/logic/proyeccion'
import { getVencimientoInfo } from '@/lib/logic/vencimientos'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { ProximosExamenes } from '@/components/stats/ProximosExamenes'
import Link from 'next/link'

function estaAprobada(estado: Estado): boolean {
  return estado === 'final_aprobado' || estado === 'promocionada'
}

interface StatsPanelProps {
  profile: UserProfile
  estados: Record<string, MateriaEstado>
  seminarios: Seminario[]
}

export function StatsPanel({ profile, estados, seminarios }: StatsPanelProps) {
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(profile.nombre_completo ?? '')

  const estadoMap: Record<string, Estado> = {}
  for (const [id, e] of Object.entries(estados)) {
    estadoMap[id] = e.estado
  }

  const materiasAprobadas = Object.values(estados).filter((e) =>
    estaAprobada(e.estado)
  ).length
  const totalMaterias = MATERIAS.length
  const porcentaje = totalMaterias > 0 ? Math.round((materiasAprobadas / totalMaterias) * 100) : 0

  const horas = calcularHorasAcreditadas(estadoMap)
  const { promedio, materiasConNota } = calcularPromedio(estados)
  const proyeccion = calcularProyeccion(estados)

  // Regularidades proximas a vencer (< 90 días o ya vencidas)
  const regularidadesEnRiesgo = MATERIAS
    .filter((m) => {
      const e = estados[m.id]
      return (
        e &&
        (e.estado === 'regular_vigente' || e.estado === 'regular_vencida') &&
        e.vencimiento_regularidad
      )
    })
    .map((m) => ({
      materia: m,
      info: getVencimientoInfo(estados[m.id].vencimiento_regularidad!),
    }))
    .filter((x) => x.info.dias < 90)
    .sort((a, b) => a.info.dias - b.info.dias)
    .slice(0, 4)

  const semAprobados = seminarios.filter(
    (s) => s.estado === 'final_aprobado' || s.estado === 'promocionada'
  ).length

  const ciclos: { ciclo: Ciclo; label: string }[] = [
    { ciclo: 'introductorio', label: 'Introductorio' },
    { ciclo: 'formacion_disciplinar', label: 'Disciplinar' },
    { ciclo: 'formacion_profesional', label: 'Profesional' },
  ]

  async function handleNameBlur() {
    setEditingName(false)
    if (nameValue !== (profile.nombre_completo ?? '')) {
      try {
        const supabase = createClient()
        await supabase
          .from('profiles')
          .update({ nombre_completo: nameValue || null })
          .eq('id', profile.id)
      } catch (err) {
        console.error('Error actualizando nombre:', err)
      }
    }
  }

  return (
    <div className="space-y-5">
      {/* Nombre */}
      <div>
        {editingName ? (
          <Input
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
            autoFocus
            placeholder="Tu nombre"
            className="h-8 text-sm font-semibold"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-sm font-semibold hover:underline"
          >
            {nameValue || 'Estudiante'}
          </button>
        )}
      </div>

      {/* Progreso general */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">Progreso</span>
          <span className="text-2xl font-bold">{porcentaje}%</span>
        </div>
        <Progress value={porcentaje} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {materiasAprobadas} / {totalMaterias} materias
        </p>
      </div>

      {/* Horas */}
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Horas acreditadas</span>
        <p className="text-sm font-medium">
          {horas} / {HORAS_TOTALES_OBLIGATORIAS} hs
        </p>
      </div>

      {/* Promedio */}
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Promedio</span>
        {promedio != null ? (
          <>
            <p className="text-xl font-bold">{promedio}</p>
            <p className="text-xs text-muted-foreground">
              {materiasConNota} materias con nota
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Sin datos aún</p>
        )}
        <p className="text-xs italic text-muted-foreground">
          Solo materias aprobadas, sin aplazos
        </p>
      </div>

      {/* Proyeccion */}
      {proyeccion.anioEstimado && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Proyección</span>
          <p className="text-sm font-medium">
            Egreso estimado: {proyeccion.anioEstimado}
          </p>
          <p className="text-xs italic text-muted-foreground">
            Estimación aproximada basada en tu ritmo actual
          </p>
        </div>
      )}

      {/* Vencimientos proximos */}
      {regularidadesEnRiesgo.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Regularidades</span>
            <Link href="/perfil" className="text-xs text-blue-600 hover:underline">
              Gestionar
            </Link>
          </div>
          {regularidadesEnRiesgo.map(({ materia, info }) => (
            <div key={materia.id} className="flex items-center justify-between gap-2">
              <span
                className="truncate text-xs"
                title={materia.nombre}
              >
                {materia.nombre}
              </span>
              <span
                className={`shrink-0 text-xs font-medium ${
                  info.estado === 'expired'
                    ? 'text-gray-500'
                    : info.estado === 'danger'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                }`}
              >
                {info.estado === 'expired'
                  ? 'Vencida'
                  : `${info.dias}d`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Proximos examenes sugeridos */}
      <ProximosExamenes estados={estados} />

      {/* Progreso por ciclo */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Por ciclo</span>
        {ciclos.map(({ ciclo, label }) => {
          const materiasDelCiclo = MATERIAS.filter((m) => m.ciclo === ciclo)
          const aprobadasCiclo = materiasDelCiclo.filter(
            (m) => estados[m.id] && estaAprobada(estados[m.id].estado)
          ).length
          const pct =
            materiasDelCiclo.length > 0
              ? Math.round((aprobadasCiclo / materiasDelCiclo.length) * 100)
              : 0
          return (
            <div key={ciclo} className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span>
                  {aprobadasCiclo}/{materiasDelCiclo.length}
                </span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          )
        })}
        {/* Optativos */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Optativos</span>
            <span>{semAprobados}/3</span>
          </div>
          <Progress value={Math.round((semAprobados / 3) * 100)} className="h-1.5" />
        </div>
      </div>
    </div>
  )
}
