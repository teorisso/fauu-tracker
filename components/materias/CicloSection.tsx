import { Materia, MateriaEstado, Ciclo } from '@/lib/types'
import { MateriaCard } from './MateriaCard'

const CICLO_LABELS: Record<Ciclo, string> = {
  introductorio: 'Ciclo Introductorio',
  formacion_disciplinar: 'Ciclo de Formación Disciplinar',
  formacion_profesional: 'Ciclo de Formación Profesional',
}

const ANIO_LABELS: Record<number, string> = {
  1: '1er Año',
  2: '2do Año',
  3: '3er Año',
  4: '4to Año',
  5: '5to Año',
  6: '6to Año',
}

interface CicloSectionProps {
  ciclo: Ciclo
  materias: Materia[]
  estados: Record<string, MateriaEstado>
  onActualizarEstado: (materiaId: string, data: Partial<MateriaEstado>) => Promise<void>
}

export function CicloSection({
  ciclo,
  materias,
  estados,
  onActualizarEstado,
}: CicloSectionProps) {
  const anios = Array.from(new Set(materias.map((m) => m.anio))).sort()

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{CICLO_LABELS[ciclo]}</h2>
      {anios.map((anio) => {
        const materiasDelAnio = materias.filter((m) => m.anio === anio)
        return (
          <div key={anio} className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              {ANIO_LABELS[anio]}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {materiasDelAnio.map((materia) => (
                <MateriaCard
                  key={materia.id}
                  materia={materia}
                  estado={estados[materia.id]}
                  allEstados={estados}
                  onActualizarEstado={onActualizarEstado}
                />
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}
