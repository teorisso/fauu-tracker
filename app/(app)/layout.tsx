import { NavLinks } from '@/components/NavLinks'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 py-3">
        <span className="font-semibold text-sm md:text-base">FAUU Tracker</span>
        <nav className="flex items-center gap-2 md:gap-4">
          <NavLinks />
          <ThemeToggle />
          <LogoutButton compact />
        </nav>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground">
        <span>FAUU Tracker · Arquitectura Plan 2018 · FAU-UNNE</span>
        <span className="mx-2 opacity-40">·</span>
        <span>
          Hecho por{' '}
          <strong className="font-medium text-foreground/60">Teo Risso</strong>
          {' '}— Estudiante y desarrollador
        </span>
      </footer>
    </div>
  )
}
