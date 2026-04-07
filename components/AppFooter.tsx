import { cn } from '@/lib/utils'
import Link from 'next/link'

interface AppFooterProps {
  className?: string
}

export function AppFooter({ className }: AppFooterProps) {
  return (
    <footer className={cn('border-t px-4 py-4 text-center text-xs text-muted-foreground', className)}>
      <span>FAUU Tracker · Arquitectura Plan 2018 · FAU-UNNE</span>
      <span className="mx-2 opacity-40">·</span>
      <span>
        Hecho por{' '}
        <strong className="font-medium text-foreground/60">Teo Risso</strong>
        {' '}— Estudiante y desarrollador
      </span>
      <span className="mx-2 opacity-40">·</span>
      <Link
        href="/terminos"
        className="underline underline-offset-2 hover:opacity-80 transition-opacity"
      >
        Términos y Condiciones
      </Link>
    </footer>
  )
}
