import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GestionarCalendarioClient } from '@/components/calendario/GestionarCalendarioClient'

export default async function GestionarCalendarioPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: mesasCustom } = await supabase
    .from('mesas_custom')
    .select('*')
    .eq('user_id', user.id)
    .order('anio', { ascending: true })
    .order('turno_numero', { ascending: true })

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Gestionar calendarios futuros</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cargá mesas de examen para años futuros (2027 en adelante).
          Los datos de 2026 se actualizan automáticamente desde el calendario oficial.
        </p>
      </div>

      <GestionarCalendarioClient
        userId={user.id}
        mesasCustomInit={mesasCustom ?? []}
      />
    </div>
  )
}
