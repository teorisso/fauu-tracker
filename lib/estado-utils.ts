import { Estado } from '@/lib/types'

export const ESTADO_LABELS: Record<Estado, string> = {
  sin_cursar: 'Sin cursar',
  cursando: 'Cursando',
  regular_vigente: 'Regular',
  regular_vencida: 'Vencida',
  promocionada: 'Promocionada',
  final_aprobado: 'Aprobada',
}

export const ESTADO_COLORS: Record<Estado, { bg: string; fg: string }> = {
  sin_cursar: {
    bg: 'hsl(var(--estado-sin-cursar-bg))',
    fg: 'hsl(var(--estado-sin-cursar-fg))',
  },
  cursando: {
    bg: 'hsl(var(--estado-cursando-bg))',
    fg: 'hsl(var(--estado-cursando-fg))',
  },
  regular_vigente: {
    bg: 'hsl(var(--estado-regular-vigente-bg))',
    fg: 'hsl(var(--estado-regular-vigente-fg))',
  },
  regular_vencida: {
    bg: 'hsl(var(--estado-regular-vencida-bg))',
    fg: 'hsl(var(--estado-regular-vencida-fg))',
  },
  promocionada: {
    bg: 'hsl(var(--estado-promocionada-bg))',
    fg: 'hsl(var(--estado-promocionada-fg))',
  },
  final_aprobado: {
    bg: 'hsl(var(--estado-final-aprobado-bg))',
    fg: 'hsl(var(--estado-final-aprobado-fg))',
  },
}

export const ESTADOS_ORDENADOS: Estado[] = [
  'sin_cursar',
  'cursando',
  'regular_vigente',
  'regular_vencida',
  'promocionada',
  'final_aprobado',
]
