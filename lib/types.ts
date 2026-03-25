export type Estado =
  | 'sin_cursar'
  | 'cursando'
  | 'regular_vigente'
  | 'regular_vencida'
  | 'promocionada'
  | 'final_aprobado'

export type Ciclo =
  | 'introductorio'
  | 'formacion_disciplinar'
  | 'formacion_profesional'

export interface Materia {
  id: string
  nombre: string
  horasCatedra: number
  anio: 1 | 2 | 3 | 4 | 5 | 6
  ciclo: Ciclo
  esTFC?: boolean
  esPPA?: boolean
}

export interface Correlativa {
  materiaId: string
  condicion: 'aprobada' | 'regularizada'
}

export interface ReglaCorrelatividad {
  materiaId: string
  paraPoderCursar: Correlativa[]
  requiereAnioCompleto?: number
}

export type AreaSeminario =
  | 'tecnologia_produccion_gestion'
  | 'proyecto_planeamiento'
  | 'comunicacion_forma'
  | 'ciencias_sociales_humanas'

export interface MateriaEstado {
  materia_id: string
  estado: Estado
  anio_cursado?: number
  cuatrimestre?: 1 | 2
  nota?: number
  intentos_previos: number
  fecha_regularidad?: string       // YYYY-MM-DD
  fecha_aprobacion?: string        // YYYY-MM-DD
  vencimiento_regularidad?: string // YYYY-MM-DD
}

export interface Seminario {
  numero: 1 | 2 | 3
  nombre?: string
  area?: AreaSeminario
  estado: Estado
  anio_cursado?: number
  cuatrimestre?: 1 | 2
  nota?: number
}

export interface UserProfile {
  id: string
  nombre_completo?: string
  carrera_completada: boolean
}
