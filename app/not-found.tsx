import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <FileQuestion className="h-16 w-16 text-muted-foreground/30" strokeWidth={1} />
        <p className="text-7xl font-bold text-muted-foreground/20 select-none">404</p>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Página no encontrada</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          La URL que buscás no existe en FAUU Tracker. Verificá que no haya un error tipográfico.
        </p>
      </div>

      <div className="flex gap-3">
        <Button asChild>
          <Link href="/materias">Ir al inicio</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Volver al inicio de sesión</Link>
        </Button>
      </div>
    </div>
  )
}
