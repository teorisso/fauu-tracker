import { AppFooter } from '@/components/AppFooter'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Términos y Condiciones — FAUU Tracker',
  description:
    'Términos de uso y política de privacidad del FAUU Tracker, la herramienta de seguimiento académico para estudiantes de Arquitectura Plan 2018 de la FAU-UNNE.',
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-4 py-3">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <span className="text-muted-foreground/50 select-none">·</span>
          <span className="text-sm font-medium">FAUU Tracker</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10 md:py-16">
        <div className="space-y-2 mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Términos y Condiciones</h1>
          <p className="text-muted-foreground text-sm">
            Última actualización: abril de 2026
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10 text-sm leading-relaxed">

          <Section title="1. Descripción del servicio">
            <p>
              FAUU Tracker es una herramienta de seguimiento académico sin fines de lucro,
              desarrollada por estudiantes para estudiantes de Arquitectura Plan 2018 de la
              Facultad de Arquitectura y Urbanismo de la Universidad Nacional del Nordeste (FAU-UNNE).
            </p>
            <p>
              El servicio permite registrar y visualizar el progreso académico personal (estados
              de materias, notas, regularidades), consultar el calendario de mesas de examen y
              configurar alertas de vencimiento.
            </p>
            <p>
              El uso de este servicio es <strong>voluntario y gratuito</strong>. No forma parte
              de sistemas oficiales de la UNNE; los datos que cargás no tienen validez académica
              oficial.
            </p>
          </Section>

          <Section title="2. Datos que recopilamos">
            <p>Para brindar el servicio, recopilamos y almacenamos:</p>
            <ul>
              <li>
                <strong>Datos de cuenta:</strong> dirección de correo electrónico y, en caso de
                usar Google, los datos básicos de tu perfil público (nombre y foto de perfil).
              </li>
              <li>
                <strong>Progreso académico:</strong> estados de materias, notas, fechas de
                regularidad y aprobación, estados de seminarios. Estos datos son ingresados
                exclusivamente por vos.
              </li>
              <li>
                <strong>Preferencias de usuario:</strong> configuración de notificaciones,
                suscripciones push, mesas de examen anotadas.
              </li>
              <li>
                <strong>Datos técnicos:</strong> tokens de sesión y registros de actividad
                mínimos necesarios para el funcionamiento seguro del servicio.
              </li>
            </ul>
            <p>
              <strong>No vendemos ni compartimos tus datos</strong> con ningún tercero, más
              allá de los proveedores de infraestructura listados en la sección siguiente.
            </p>
          </Section>

          <Section title="3. Proveedores de infraestructura">
            <p>
              El servicio utiliza los siguientes proveedores externos para su funcionamiento:
            </p>
            <ul>
              <li>
                <strong>Supabase</strong> (base de datos y autenticación) — los datos se
                almacenan en servidores ubicados en Brasil (sa-east-1). Política de privacidad:{' '}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  supabase.com/privacy
                </a>
              </li>
              <li>
                <strong>Vercel</strong> (infraestructura de la aplicación). Política de privacidad:{' '}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  vercel.com/legal/privacy-policy
                </a>
              </li>
              <li>
                <strong>Google OAuth</strong> (opcional, si elegís ingresar con Google). Al
                usar esta opción, Google puede recopilar datos según su propia política de
                privacidad.
              </li>
            </ul>
          </Section>

          <Section title="4. Uso de cookies y almacenamiento local">
            <p>
              El servicio utiliza cookies de sesión estrictamente necesarias para mantener tu
              sesión iniciada. Estas cookies son esenciales para el funcionamiento de la
              autenticación y no pueden desactivarse.
            </p>
            <p>
              No utilizamos cookies de rastreo, publicidad ni analítica de terceros.
            </p>
          </Section>

          <Section title="5. Seguridad de los datos">
            <p>
              Todos los datos están protegidos con Row Level Security (RLS) en la base de datos:
              cada usuario solo puede acceder a sus propios datos. Las conexiones son cifradas
              mediante HTTPS/TLS.
            </p>
            <p>
              Sin embargo, ningún sistema es 100% inviolable. Te recomendamos no ingresar datos
              altamente sensibles más allá de los estrictamente necesarios para el seguimiento
              académico.
            </p>
          </Section>

          <Section title="6. Tus derechos">
            <p>Como usuario, tenés derecho a:</p>
            <ul>
              <li>
                <strong>Acceder</strong> a todos tus datos desde la aplicación (sección
                Perfil).
              </li>
              <li>
                <strong>Rectificar</strong> cualquier dato incorrecto modificando los estados
                de materias directamente en el dashboard.
              </li>
              <li>
                <strong>Eliminar</strong> tu cuenta y todos los datos asociados de forma
                permanente desde la sección Perfil → &quot;Eliminar cuenta&quot;.
              </li>
              <li>
                <strong>Exportar</strong> tu progreso desde la sección Perfil (próximamente).
              </li>
            </ul>
            <p>
              La eliminación de cuenta borra de forma irreversible: tu perfil, todos los
              estados de materias y seminarios, preferencias de notificación, suscripciones push
              y mesas anotadas.
            </p>
          </Section>

          <Section title="7. Limitación de responsabilidad">
            <p>
              FAUU Tracker es un proyecto educativo independiente. No garantizamos la exactitud,
              completitud o disponibilidad continua del servicio. Los datos del plan de estudios,
              correlatividades y calendario académico se basan en fuentes oficiales públicas, pero
              pueden contener errores u omisiones.
            </p>
            <p>
              <strong>
                Para información académica oficial, siempre consultá el SIU Guaraní y las
                autoridades de la FAU-UNNE.
              </strong>
            </p>
          </Section>

          <Section title="8. Cambios a estos términos">
            <p>
              Podemos actualizar estos términos ocasionalmente. En caso de cambios significativos,
              te notificaremos mediante un aviso en la aplicación. El uso continuado del servicio
              tras la notificación implica la aceptación de los nuevos términos.
            </p>
          </Section>

          <Section title="9. Contacto">
            <p>
              Si tenés preguntas, sugerencias o querés ejercer alguno de tus derechos, podés
              contactarnos abriendo un issue en el repositorio del proyecto o mediante los canales
              de comunicación disponibles en la FAU-UNNE.
            </p>
          </Section>

        </div>
      </main>

      <AppFooter />
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground border-b pb-2">{title}</h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  )
}
