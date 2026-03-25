/**
 * Logica de vencimientos de regularidad.
 *
 * Segun el reglamento UNNE (Res. CS 316/2019), la regularidad vence a los
 * 3 anios mas la duracion del periodo de cursada:
 *   - Materia anual: vence 3 anios + 1 anio = 4 anios despues de la regularidad
 *   - Materia cuatrimestral: vence 3 anios + 1 cuatrimestre despues
 *
 * En la practica el SIU calcula el vencimiento al ultimo dia del periodo
 * siguiente al que corresponde (ej: si cursa en 1C, vence al 28/feb del 4to anio).
 * Como el usuario puede consultar la fecha exacta en el SIU, la app permite
 * ingresarla manualmente. La fecha calculada aqui es solo una aproximacion.
 */

// Tipo de periodo de cursada de una materia
export type PeriodoCursada = 'anual' | 'cuatrimestral'

export type EstadoVencimiento = 'ok' | 'warning' | 'danger' | 'expired'

/** Agrega meses a una fecha ISO (YYYY-MM-DD), devuelve YYYY-MM-DD */
function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1 + months, d)
  return date.toISOString().split('T')[0]
}

/**
 * Calcula el vencimiento aproximado de la regularidad.
 * - Anual: 4 anios despues de la fecha de regularidad (3 anios + 1 anio de duracion)
 * - Cuatrimestral: 3 anios y 6 meses despues (3 anios + 1 cuatrimestre)
 *
 * Devuelve YYYY-MM-DD.
 */
export function calcularVencimientoAproximado(
  fechaRegularidad: string,
  periodo: PeriodoCursada = 'anual'
): string {
  const meses = periodo === 'anual' ? 48 : 42 // 4 años vs 3 años y medio
  return addMonths(fechaRegularidad, meses)
}

/** Cantidad de dias hasta el vencimiento (negativo = ya venció) */
export function diasHastaVencimiento(vencimientoISO: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const venc = new Date(vencimientoISO + 'T00:00:00')
  return Math.floor((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

/** Estado de urgencia del vencimiento */
export function estadoVencimiento(dias: number): EstadoVencimiento {
  if (dias < 0) return 'expired'
  if (dias < 30) return 'danger'
  if (dias < 90) return 'warning'
  return 'ok'
}

/** Formatea una fecha YYYY-MM-DD a DD/MM/YYYY */
export function formatFechaDisplay(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

export interface VencimientoInfo {
  dias: number
  estado: EstadoVencimiento
  label: string
}

/**
 * Devuelve un objeto completo con la info del vencimiento para mostrar en la UI.
 */
export function getVencimientoInfo(vencimientoISO: string): VencimientoInfo {
  const dias = diasHastaVencimiento(vencimientoISO)
  const estado = estadoVencimiento(dias)

  let label: string
  if (estado === 'expired') {
    label = `Venció hace ${Math.abs(dias)} días`
  } else if (dias === 0) {
    label = 'Vence hoy'
  } else if (dias === 1) {
    label = 'Vence mañana'
  } else if (dias < 30) {
    label = `Vence en ${dias} días`
  } else {
    label = `Vence el ${formatFechaDisplay(vencimientoISO)}`
  }

  return { dias, estado, label }
}
