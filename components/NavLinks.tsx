'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/materias', label: 'Materias' },
  { href: '/calendario', label: 'Calendario' },
  { href: '/perfil', label: 'Perfil' },
]

export function NavLinks() {
  const pathname = usePathname()
  return (
    <>
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`text-sm transition-colors ${
            pathname === href
              ? 'font-semibold text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {label}
        </Link>
      ))}
    </>
  )
}
