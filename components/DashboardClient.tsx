'use client'

import { useState, useMemo } from 'react'
import { useMaterias } from '@/lib/hooks/useMaterias'
import { MATERIAS, HORAS_TOTALES_OBLIGATORIAS } from '@/lib/data/materias'
import { MateriaEstado, Seminario, UserProfile, Ciclo, Estado } from '@/lib/types'
import { CicloSection } from '@/components/materias/CicloSection'
import { SeminarioCard } from '@/components/seminarios/SeminarioCard'
import { StatsPanel } from '@/components/stats/StatsPanel'
import { Leyenda } from '@/components/materias/Leyenda'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { getVencimientoInfo } from '@/lib/logic/vencimientos'
import { calcularPromedio } from '@/lib/logic/promedios'
import { CountdownBanner } from '@/components/CountdownBanner'
import Link from 'next/link'
import { AlertTriangle, Search, X, BookOpen, Upload } from 'lucide-react'

interface DashboardClientProps {
  profile: UserProfile
  initialEstados: Record<string, MateriaEstado>
  initialSeminarios: Seminario[]
}

const CICLOS_ORDENADOS: Ciclo[] = [
  'introductorio',
  'formacion_disciplinar',
  'formacion_profesional',
]

type FiltroEstado = 'todas' | 'aprobadas' | 'por_rendir' | 'en_curso' | 'sin_cursar'

const FILTROS: { id: FiltroEstado; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'por_rendir', label: 'Para rendir' },
  { id: 'aprobadas', label: 'Aprobadas' },
  { id: 'en_curso', label: 'En curso' },
  { id: 'sin_cursar', label: 'Sin cursar' },
]

function matchesFiltroEstado(estado: Estado | undefined, filtro: FiltroEstado): boolean {
  if (filtro === 'todas') return true
  if (filtro === 'aprobadas') return estado === 'final_aprobado' || estado === 'promocionada'
  if (filtro === 'por_rendir') return estado === 'regular_vigente' || estado === 'regular_vencida'
  if (filtro === 'en_curso') return estado === 'cursando'
  if (filtro === 'sin_cursar') return !estado || estado === 'sin_cursar'
  return true
}

export function DashboardClient({
  profile,
  initialEstados,
  initialSeminarios,
}: DashboardClientProps) {
  const { estados, seminarios, actualizarEstado, actualizarSeminario } =
    useMaterias(initialEstados, initialSeminarios, profile.id)

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas')

  // Datos para mobile stats
  const mobileStats = useMemo(() => {
    const aprobadas = Object.values(estados).filter(
      (e) => e.estado === 'final_aprobado' || e.estado === 'promocionada'
    ).length
    const total = MATERIAS.length
    const pct = total > 0 ? Math.round((aprobadas / total) * 100) : 0
    const horas = MATERIAS.reduce((acc, m) => {
      const e = estados[m.id]
      return e && (e.estado === 'final_aprobado' || e.estado === 'promocionada')
        ? acc + m.horasCatedra
        : acc
    }, 0)
    const { promedio } = calcularPromedio(estados)
    const riesgoMaterias = MATERIAS.filter((m) => {
      const e = estados[m.id]
      if (!e || !e.vencimiento_regularidad) return false
      if (e.estado !== 'regular_vigente') return false
      const { dias } = getVencimientoInfo(e.vencimiento_regularidad)
      return dias >= 0 && dias < 90
    })
    const riesgo = riesgoMaterias.length
    return { aprobadas, total, pct, horas, promedio, riesgo }
  }, [estados])

  // Banner de vencimientos urgentes — solo las que AÚN NO vencieron (dias >= 0)
  const vencimientosUrgentes = useMemo(
    () =>
      MATERIAS.filter((m) => {
        const e = estados[m.id]
        if (!e || !e.vencimiento_regularidad) return false
        if (e.estado !== 'regular_vigente') return false
        const { dias } = getVencimientoInfo(e.vencimiento_regularidad)
        return dias >= 0 && dias < 90
      }),
    [estados]
  )

  const hasData = Object.keys(estados).length > 0

  // Conteo por filtro para los chips
  const filtroCounts = useMemo(() => {
    const counts: Record<FiltroEstado, number> = {
      todas: MATERIAS.length,
      aprobadas: 0,
      por_rendir: 0,
      en_curso: 0,
      sin_cursar: 0,
    }
    for (const m of MATERIAS) {
      const e = estados[m.id]?.estado
      if (e === 'final_aprobado' || e === 'promocionada') counts.aprobadas++
      else if (e === 'regular_vigente' || e === 'regular_vencida') counts.por_rendir++
      else if (e === 'cursando') counts.en_curso++
      else counts.sin_cursar++
    }
    return counts
  }, [estados])

  // Materias filtradas por ciclo
  function getMateriasDelCiclo(ciclo: Ciclo) {
    return MATERIAS.filter((m) => {
      if (m.ciclo !== ciclo) return false
      if (busqueda && !m.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false
      if (!matchesFiltroEstado(estados[m.id]?.estado, filtroEstado)) return false
      return true
    })
  }

  const totalFiltradas = CICLOS_ORDENADOS.reduce(
    (acc, ciclo) => acc + getMateriasDelCiclo(ciclo).length,
    0
  )

  return (
    <div className="flex min-h-[calc(100vh-57px)] md:min-h-screen">
      {/* Sidebar desktop — solo stats */}
      <aside className="hidden w-72 shrink-0 border-r bg-muted/40 md:block">
        <ScrollArea className="h-screen">
          <div className="flex h-full flex-col p-4">
            <div className="border-b pb-3">
              <p className="text-xs text-muted-foreground">Arquitectura Plan 2018 · FAU-UNNE</p>
            </div>
            <div className="flex-1 space-y-6 py-4">
              <StatsPanel profile={profile} estados={estados} seminarios={seminarios} />
              <div className="border-t pt-4">
                <Leyenda />
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-6xl space-y-5">

          {/* Stats compacto — solo mobile */}
          {hasData && (
            <div className="block md:hidden space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{profile.nombre_completo ?? 'Tu avance'}</span>
                <span className="text-lg font-bold">{mobileStats.pct}%</span>
              </div>
              <Progress value={mobileStats.pct} className="h-2" />
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>{mobileStats.aprobadas}/{mobileStats.total} aprobadas</span>
                <span>·</span>
                <span>{mobileStats.horas}/{HORAS_TOTALES_OBLIGATORIAS} hs</span>
                {mobileStats.promedio != null && (
                  <>
                    <span>·</span>
                    <span>Promedio {mobileStats.promedio}</span>
                  </>
                )}
                {mobileStats.riesgo > 0 && (
                  <>
                    <span>·</span>
                    <span className="font-medium text-amber-600">
                      {mobileStats.riesgo} reg. en riesgo
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Onboarding — usuario sin datos */}
          {!hasData && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-950/20">
              <div className="flex items-start gap-3">
                <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div className="space-y-2">
                  <p className="font-semibold text-blue-900 dark:text-blue-200">
                    Bienvenido a FAUU Tracker
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Podés empezar cargando tus materias manualmente o importar tu historial
                    desde el SIU Guaraní para auto-completar estados, fechas y notas.
                  </p>
                  <Link
                    href="/perfil"
                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Importar desde SIU Guaraní
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Banner de vencimientos urgentes */}
          {vencimientosUrgentes.length > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                Tenés{' '}
                <strong>
                  {vencimientosUrgentes.length} regularidad
                  {vencimientosUrgentes.length !== 1 ? 'es' : ''}
                </strong>{' '}
                próxima{vencimientosUrgentes.length !== 1 ? 's' : ''} a vencer.{' '}
                <Link href="/perfil" className="font-medium underline underline-offset-2">
                  Ver detalle
                </Link>
              </span>
            </div>
          )}

          {/* Countdown a la proxima mesa */}
          <CountdownBanner />

          {/* Buscador + filtros */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar materia..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-md border bg-background py-2 pl-9 pr-9 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FILTROS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFiltroEstado(id)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    filtroEstado === id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {label}
                  {id !== 'todas' && (
                    <span className="ml-1 opacity-60">{filtroCounts[id]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Leyenda colapsable — solo mobile */}
          <details className="block md:hidden group">
            <summary className="cursor-pointer list-none text-xs text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-1">
                <span className="transition-transform group-open:rotate-90">▶</span>
                Ver leyenda de estados
              </span>
            </summary>
            <div className="mt-2 rounded-md border bg-muted/40 p-3">
              <Leyenda />
            </div>
          </details>

          {/* Ciclos */}
          {CICLOS_ORDENADOS.map((ciclo) => {
            const materiasDelCiclo = getMateriasDelCiclo(ciclo)
            if (materiasDelCiclo.length === 0) return null
            return (
              <CicloSection
                key={ciclo}
                ciclo={ciclo}
                materias={materiasDelCiclo}
                estados={estados}
                onActualizarEstado={actualizarEstado}
              />
            )
          })}

          {/* Sin resultados */}
          {totalFiltradas === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Search className="mx-auto mb-3 h-8 w-8 opacity-40" />
              <p className="text-sm">No hay materias que coincidan.</p>
              <button
                onClick={() => { setBusqueda(''); setFiltroEstado('todas') }}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* Seminarios optativos */}
          <section className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Seminarios Optativos</h2>
                <span className="text-sm text-muted-foreground">
                  {seminarios.filter((s) => s.estado === 'final_aprobado' || s.estado === 'promocionada').length}/3 aprobados
                </span>
              </div>
              <Progress
                value={Math.round(
                  (seminarios.filter((s) => s.estado === 'final_aprobado' || s.estado === 'promocionada').length / 3) * 100
                )}
                className="h-1.5"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {seminarios.map((sem) => (
                <SeminarioCard
                  key={sem.numero}
                  seminario={sem}
                  onUpdate={(datos) => actualizarSeminario(sem.numero, datos)}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
