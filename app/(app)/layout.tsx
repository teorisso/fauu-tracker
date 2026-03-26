import { NavLinks } from '@/components/NavLinks'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AppFooter } from '@/components/AppFooter'

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
      <AppFooter />
    </div>
  )
}
