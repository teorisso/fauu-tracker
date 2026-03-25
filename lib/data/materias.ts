import { Materia } from '@/lib/types'

export const MATERIAS: Materia[] = [
  // 1er año - Ciclo Introductorio
  { id: 'curso_ingreso', nombre: 'Curso de Ingreso', horasCatedra: 60, anio: 1, ciclo: 'introductorio' },
  { id: 'arquitectura_1', nombre: 'Arquitectura I', horasCatedra: 196, anio: 1, ciclo: 'introductorio' },
  { id: 'sistemas_representacion', nombre: 'Sistemas de Representación y Expresión', horasCatedra: 140, anio: 1, ciclo: 'introductorio' },
  { id: 'ciencias_basicas', nombre: 'Ciencias Básicas Aplicadas al Diseño', horasCatedra: 84, anio: 1, ciclo: 'introductorio' },
  { id: 'intro_tecnologia', nombre: 'Introducción a la Tecnología', horasCatedra: 140, anio: 1, ciclo: 'introductorio' },
  { id: 'intro_diseno', nombre: 'Introducción al Diseño', horasCatedra: 70, anio: 1, ciclo: 'introductorio' },

  // 2do año - Ciclo Formación Disciplinar
  { id: 'arquitectura_2', nombre: 'Arquitectura II', horasCatedra: 196, anio: 2, ciclo: 'formacion_disciplinar' },
  { id: 'morfologia_1', nombre: 'Morfología I', horasCatedra: 112, anio: 2, ciclo: 'formacion_disciplinar' },
  { id: 'construcciones_1', nombre: 'Construcciones I', horasCatedra: 70, anio: 2, ciclo: 'formacion_disciplinar' },
  { id: 'estructuras_1', nombre: 'Estructuras I', horasCatedra: 70, anio: 2, ciclo: 'formacion_disciplinar' },
  { id: 'instalaciones_1', nombre: 'Instalaciones I', horasCatedra: 70, anio: 2, ciclo: 'formacion_disciplinar' },
  { id: 'historia_critica_1', nombre: 'Historia y Crítica I', horasCatedra: 70, anio: 2, ciclo: 'formacion_disciplinar' },
  { id: 'teoria_diseno_1', nombre: 'Teoría del Diseño Arquitectónico I', horasCatedra: 70, anio: 2, ciclo: 'formacion_disciplinar' },

  // 3er año
  { id: 'arquitectura_3', nombre: 'Arquitectura III', horasCatedra: 196, anio: 3, ciclo: 'formacion_disciplinar' },
  { id: 'morfologia_2', nombre: 'Morfología II', horasCatedra: 112, anio: 3, ciclo: 'formacion_disciplinar' },
  { id: 'construcciones_2', nombre: 'Construcciones II', horasCatedra: 70, anio: 3, ciclo: 'formacion_disciplinar' },
  { id: 'estructuras_2', nombre: 'Estructuras II', horasCatedra: 70, anio: 3, ciclo: 'formacion_disciplinar' },
  { id: 'instalaciones_2', nombre: 'Instalaciones II', horasCatedra: 70, anio: 3, ciclo: 'formacion_disciplinar' },
  { id: 'historia_critica_2', nombre: 'Historia y Crítica II', horasCatedra: 70, anio: 3, ciclo: 'formacion_disciplinar' },
  { id: 'intro_urbanismo', nombre: 'Introducción al Urbanismo y al Planeamiento', horasCatedra: 70, anio: 3, ciclo: 'formacion_disciplinar' },

  // 4to año
  { id: 'arquitectura_4', nombre: 'Arquitectura IV', horasCatedra: 196, anio: 4, ciclo: 'formacion_disciplinar' },
  { id: 'construcciones_3', nombre: 'Construcciones III', horasCatedra: 90, anio: 4, ciclo: 'formacion_disciplinar' },
  { id: 'estructuras_3', nombre: 'Estructuras III', horasCatedra: 84, anio: 4, ciclo: 'formacion_disciplinar' },
  { id: 'instalaciones_3', nombre: 'Instalaciones III', horasCatedra: 78, anio: 4, ciclo: 'formacion_disciplinar' },
  { id: 'urbanismo', nombre: 'Urbanismo', horasCatedra: 84, anio: 4, ciclo: 'formacion_disciplinar' },
  { id: 'historia_critica_3', nombre: 'Historia y Crítica III', horasCatedra: 70, anio: 4, ciclo: 'formacion_disciplinar' },
  { id: 'teoria_diseno_2', nombre: 'Teoría del Diseño Arquitectónico II', horasCatedra: 70, anio: 4, ciclo: 'formacion_disciplinar' },

  // 5to año - Ciclo Formación Profesional
  { id: 'arquitectura_5', nombre: 'Arquitectura V', horasCatedra: 235, anio: 5, ciclo: 'formacion_profesional' },
  { id: 'organizacion_produccion_obras', nombre: 'Organización y Producción de Obras', horasCatedra: 84, anio: 5, ciclo: 'formacion_profesional' },
  { id: 'planeamiento_territorial', nombre: 'Planeamiento y Ordenamiento Territorial', horasCatedra: 84, anio: 5, ciclo: 'formacion_profesional' },
  { id: 'gestion_habitat_social', nombre: 'Gestión y Producción del Hábitat Social', horasCatedra: 84, anio: 5, ciclo: 'formacion_profesional' },

  // 6to año
  { id: 'tfc', nombre: 'Trabajo Final de Carrera', horasCatedra: 235, anio: 6, ciclo: 'formacion_profesional', esTFC: true },
  { id: 'ppa', nombre: 'Práctica Profesional Asistida', horasCatedra: 140, anio: 6, ciclo: 'formacion_profesional', esPPA: true },
  { id: 'org_legislacion_gestion', nombre: 'Organización, Legislación y Gestión Profesional', horasCatedra: 112, anio: 6, ciclo: 'formacion_profesional' },
]

export const HORAS_TOTALES_OBLIGATORIAS = 3592
export const HORAS_OPTATIVAS = 210
