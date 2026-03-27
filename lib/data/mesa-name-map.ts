/**
 * Mapeo de títulos de examen de la página de Turnos de la FAU
 * hacia los materiaIds internos de la app.
 *
 * Fuente: https://www.arq.unne.edu.ar/turno-examenes/
 *
 * Valores:
 *   string   → un solo materiaId
 *   string[] → múltiples materiaIds (el título agrupa varias materias)
 *   null     → optativa / seminario electivo / sin equivalencia en el plan
 */
export type MesaNameMapEntry = string | string[] | null

export const MESA_NAME_MAP: Record<string, MesaNameMapEntry> = {
  // ── Área Tecnología ────────────────────────────────────────────────────────
  'Introducción a la Tecnología': 'intro_tecnologia',
  'Ciencias Básicas': 'ciencias_basicas',
  'Instalaciones I': 'instalaciones_1',
  'Instalaciones II - Instalaciones III (Plan 2018)': ['instalaciones_2', 'instalaciones_3'],
  'Estructuras I (Plan 2018)': 'estructuras_1',
  'Estructuras II (Plan 2018)': 'estructuras_2',
  'Estructuras III (Plan 2018)': 'estructuras_3',
  'Estructuras III (Plan 03/06)': 'estructuras_3',
  'Construcciones I (Plan 2018)': 'construcciones_1',
  'Construcciones II (Plan 2018)': 'construcciones_2',
  'Construcciones III A (Plan 2018)': 'construcciones_3',
  'Construcciones III B (Plan 2018)': 'construcciones_3',

  // ── Área Historia y Teoría ─────────────────────────────────────────────────
  'Historia y Crítica I': 'historia_critica_1',
  'Historia y Crítica II': 'historia_critica_2',
  'Historia y Crítica III': 'historia_critica_3',
  'Teoría del Diseño Arquitectónico I': 'teoria_diseno_1',
  'Teoría del Diseño Arquitectónico II (Plan 2018)': 'teoria_diseno_2',

  // ── Área Urbanismo ─────────────────────────────────────────────────────────
  'Introducción al Urbanismo y al Planeamiento (Plan 2018)': 'intro_urbanismo',
  'Urbanismo (Plan 2018) / Desarrollo Urbano II': 'urbanismo',
  'Planeamiento y Ordenamiento Territorial (Plan 2018)': 'planeamiento_territorial',

  // ── Área Profesional ───────────────────────────────────────────────────────
  'Gestión y Producción de Obras (Plan 2018) / Organización y Práctica Profesional - Módulo I (03/06)': 'organizacion_produccion_obras',
  'Gestión y Producción de Obras (Plan 2018)': 'organizacion_produccion_obras',
  'Organización, Legislación y Práctica Profesional (Plan 2018) / Organización y Práctica Profesional - Módulo II': 'org_legislacion_gestion',
  'Organización, Legislación y Práctica Profesional (Plan 2018)': 'org_legislacion_gestion',
  'PPA (Plan 2018) / Seminario de Práctica Asistida en Tecnología (Plan 03/06)': 'ppa',
  'PPA (Plan 2018)': 'ppa',

  // ── Optativas / Seminarios Electivos → null ────────────────────────────────
  'Patología de la Construcción': null,
  'Educación Ambiental': null,
  'Conservación del Patrimonio Arquitectónico y Urbanístico': null,
  'Energías Renovables': null,
  'Arquitectura Paisajística': null,
  'Organización y Administración de Empresas': null,
  'Historia del Arte (Plan 2018)': null,
  'Metodología de la Ciencia Aplicada al Diseño (Plan 2018)': null,
}
