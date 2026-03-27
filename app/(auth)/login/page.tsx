'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { signInWithGoogle, signInWithMagicLink } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, Mail, CheckCircle2 } from 'lucide-react'
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

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (!errorParam) return
    if (errorParam === 'auth') {
      setError('Error de autenticación. Intentá de nuevo.')
    } else if (errorParam === 'oauth_failed') {
      setError('No se pudo completar el inicio de sesión con Google. Intentá de nuevo.')
    } else if (errorParam === 'link_expired') {
      setError('El enlace de acceso expiró o ya fue usado. Solicitá uno nuevo.')
    } else {
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
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">FAU-UNNE</h1>
        <p className="text-lg font-medium text-muted-foreground">
          Tracker de Carrera
        </p>
        <p className="text-sm text-muted-foreground">
          Seguí tu progreso en Arquitectura Plan 2018
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form action={signInWithGoogle}>
          <GoogleSubmitButton />
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">o</span>
          </div>
        </div>

        {magicLinkSent ? (
          <div className="flex flex-col items-center gap-2 rounded-md bg-emerald-50 px-4 py-6 text-center dark:bg-emerald-950/30">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <p className="font-medium text-emerald-800 dark:text-emerald-300">
              Revisá tu correo
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Te enviamos un link a <strong>{email}</strong> para ingresar.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
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
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={magicLinkLoading}
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="w-full gap-2"
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
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1e3a5f] px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
