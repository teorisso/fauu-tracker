import { ReglaCorrelatividad } from '@/lib/types'

export const CORRELATIVIDADES: ReglaCorrelatividad[] = [
  // 2do año
  {
    materiaId: 'arquitectura_2',
    paraPoderCursar: [
      { materiaId: 'arquitectura_1', condicion: 'aprobada' },
      { materiaId: 'sistemas_representacion', condicion: 'aprobada' },
    ],
  },
  {
    materiaId: 'morfologia_1',
    paraPoderCursar: [
      { materiaId: 'arquitectura_1', condicion: 'aprobada' },
      { materiaId: 'sistemas_representacion', condicion: 'aprobada' },
    ],
  },
  {
    materiaId: 'estructuras_1',
    paraPoderCursar: [
      { materiaId: 'ciencias_basicas', condicion: 'regularizada' },
      { materiaId: 'intro_tecnologia', condicion: 'regularizada' },
      { materiaId: 'sistemas_representacion', condicion: 'aprobada' },
    ],
  },
  {
    materiaId: 'instalaciones_1',
    paraPoderCursar: [
      { materiaId: 'ciencias_basicas', condicion: 'regularizada' },
      { materiaId: 'intro_tecnologia', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'construcciones_1',
    paraPoderCursar: [
      { materiaId: 'sistemas_representacion', condicion: 'aprobada' },
      { materiaId: 'ciencias_basicas', condicion: 'regularizada' },
      { materiaId: 'intro_tecnologia', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'teoria_diseno_1',
    paraPoderCursar: [
      { materiaId: 'intro_diseno', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'historia_critica_1',
    paraPoderCursar: [
      { materiaId: 'sistemas_representacion', condicion: 'aprobada' },
      { materiaId: 'intro_diseno', condicion: 'regularizada' },
    ],
  },

  // 3er año
  {
    materiaId: 'arquitectura_3',
    requiereAnioCompleto: 1,
    paraPoderCursar: [
      { materiaId: 'arquitectura_2', condicion: 'aprobada' },
      { materiaId: 'morfologia_1', condicion: 'aprobada' },
    ],
  },
  {
    materiaId: 'morfologia_2',
    paraPoderCursar: [
      { materiaId: 'arquitectura_2', condicion: 'aprobada' },
      { materiaId: 'morfologia_1', condicion: 'aprobada' },
    ],
  },
  {
    materiaId: 'estructuras_2',
    paraPoderCursar: [
      { materiaId: 'estructuras_1', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'instalaciones_2',
    paraPoderCursar: [
      { materiaId: 'instalaciones_1', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'construcciones_2',
    paraPoderCursar: [
      { materiaId: 'construcciones_1', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'historia_critica_2',
    paraPoderCursar: [
      { materiaId: 'historia_critica_1', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'intro_urbanismo',
    paraPoderCursar: [
      { materiaId: 'historia_critica_1', condicion: 'regularizada' },
    ],
  },

  // 4to año
  {
    materiaId: 'arquitectura_4',
    requiereAnioCompleto: 2,
    paraPoderCursar: [
      { materiaId: 'arquitectura_3', condicion: 'aprobada' },
      { materiaId: 'morfologia_2', condicion: 'aprobada' },
    ],
  },
  {
    materiaId: 'estructuras_3',
    paraPoderCursar: [
      { materiaId: 'estructuras_2', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'instalaciones_3',
    paraPoderCursar: [
      { materiaId: 'instalaciones_1', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'construcciones_3',
    paraPoderCursar: [
      { materiaId: 'construcciones_2', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'urbanismo',
    paraPoderCursar: [
      { materiaId: 'intro_urbanismo', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'historia_critica_3',
    paraPoderCursar: [
      { materiaId: 'historia_critica_2', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'teoria_diseno_2',
    paraPoderCursar: [
      { materiaId: 'teoria_diseno_1', condicion: 'regularizada' },
    ],
  },

  // 5to año
  {
    materiaId: 'arquitectura_5',
    requiereAnioCompleto: 3,
    paraPoderCursar: [
      { materiaId: 'arquitectura_4', condicion: 'aprobada' },
    ],
  },
  {
    materiaId: 'planeamiento_territorial',
    paraPoderCursar: [
      { materiaId: 'urbanismo', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'gestion_habitat_social',
    requiereAnioCompleto: 3,
    paraPoderCursar: [],
  },
  {
    materiaId: 'organizacion_produccion_obras',
    requiereAnioCompleto: 3,
    paraPoderCursar: [],
  },

  // 6to año
  {
    materiaId: 'ppa',
    requiereAnioCompleto: 4,
    paraPoderCursar: [
      { materiaId: 'organizacion_produccion_obras', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'org_legislacion_gestion',
    requiereAnioCompleto: 4,
    paraPoderCursar: [
      { materiaId: 'organizacion_produccion_obras', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'tfc',
    requiereAnioCompleto: 4,
    paraPoderCursar: [
      { materiaId: 'arquitectura_5', condicion: 'aprobada' },
      { materiaId: 'planeamiento_territorial', condicion: 'regularizada' },
      { materiaId: 'organizacion_produccion_obras', condicion: 'regularizada' },
    ],
  },
]
