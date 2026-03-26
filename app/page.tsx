'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { signInWithGoogle, signInWithMagicLink } from './(auth)/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Loader2,
  Mail,
  CheckCircle2,
  BookOpen,
  Calendar,
  GitBranch,
  Bell,
} from 'lucide-react'
import { AppFooter } from '@/components/AppFooter'
import { useFormStatus } from 'react-dom'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function GoogleSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full gap-2" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <GoogleIcon className="h-4 w-4" />
      )}
      Continuar con Google
    </Button>
  )
}

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Seguimiento de materias',
    desc: 'Registrá el estado de cada materia: cursada, regular, aprobada o promocionada.',
  },
  {
    icon: GitBranch,
    title: 'Correlatividades',
    desc: 'Visualizá qué materias podés rendir según tus correlatividades vigentes.',
  },
  {
    icon: Calendar,
    title: 'Calendario de mesas',
    desc: 'Consultá los turnos de exámenes del año en curso y marcá en cuáles te vas a inscribir.',
  },
  {
    icon: Bell,
    title: 'Notificaciones',
    desc: 'Recibí alertas por email cuando se acercan las fechas de vencimiento de regularidad.',
  },
]

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'auth') {
      setError('Error de autenticación. Intentá de nuevo.')
    } else if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setMagicLinkLoading(true)
    setError(null)
    setMagicLinkSent(false)
    const result = await signInWithMagicLink(email)
    if (result.error) {
      setError(result.error)
    } else {
      setMagicLinkSent(true)
    }
    setMagicLinkLoading(false)
  }

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form action={signInWithGoogle}>
        <GoogleSubmitButton />
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full bg-white/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#1e3a5f] px-2 text-white/50">o</span>
        </div>
      </div>

      {magicLinkSent ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          <p className="font-medium text-emerald-300">Revisá tu correo</p>
          <p className="text-sm text-emerald-400/80">
            Te enviamos un link a <strong>{email}</strong> para ingresar.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-white/60 hover:text-white"
            onClick={() => {
              setMagicLinkSent(false)
              setEmail('')
            }}
          >
            Usar otro email
          </Button>
        </div>
      ) : (
        <form onSubmit={handleMagicLink} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-white/70 text-xs">
              Email institucional o personal
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={magicLinkLoading}
              className="border-white/20 bg-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/30"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            className="w-full gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            disabled={magicLinkLoading}
          >
            {magicLinkLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Enviar magic link
          </Button>
        </form>
      )}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#1e3a5f] text-white flex flex-col">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-20 flex-1">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/70">
            Arquitectura · Plan 2018 · FAU-UNNE
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            FAUU Tracker
          </h1>
          <p className="mt-4 text-lg text-white/60 md:text-xl">
            Seguí tu progreso académico, gestioná tus mesas de examen
            <br className="hidden md:block" /> y planificá tu carrera de Arquitectura.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
          {/* Features */}
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white/80">
              Todo lo que necesitás en un solo lugar
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="h-4 w-4 text-white/80" />
                  </div>
                  <h3 className="mb-1 text-sm font-semibold">{title}</h3>
                  <p className="text-xs leading-relaxed text-white/50">{desc}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/40 leading-relaxed">
                Desarrollado por estudiantes para estudiantes de Arquitectura Plan 2018 de la FAU-UNNE.
                Los datos de materias, correlatividades y calendario académico están basados en la
                resolución oficial RES-2025-542-CD-ARQ#UNNE.
              </p>
            </div>
          </div>

          {/* Login card */}
          <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm md:p-8">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold">Ingresá a tu cuenta</h2>
              <p className="mt-1 text-sm text-white/50">
                Usá tu cuenta de Google o recibí un link por email
              </p>
            </div>
            <Suspense>
              <LoginForm />
            </Suspense>
            <p className="mt-6 text-center text-xs text-white/30">
              Al ingresar aceptás que tus datos se almacenen de forma segura
              para gestionar tu progreso académico.
            </p>
          </div>
        </div>
      </div>

      <AppFooter className="border-white/10 text-white/30 [&_strong]:text-white/50" />
    </div>
  )
}
