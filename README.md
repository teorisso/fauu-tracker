# FAUU Tracker

Seguimiento de progreso académico para la carrera de Arquitectura Plan 2018 — FAU UNNE.

## Funcionalidades

- Dashboard de materias con estados (sin cursar, cursando, regular, aprobada)
- Importación desde SIU Guaraní (`historia_academica.xls`)
- Control de vencimientos de regularidad con alertas por email
- Calendario de mesas de examen 2026 con inscripción planificada
- Seminarios optativos configurables
- Tema claro/oscuro
- Responsive (mobile y desktop)

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (Postgres + Auth + Edge Functions)
- **Tailwind CSS** + **shadcn/ui**

## Desarrollo local

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd fauu-tracker

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.local.example .env.local
# Completar con los valores de tu proyecto Supabase

# 4. Aplicar migraciones a la base de datos
npx supabase login
npx supabase link --project-ref <tu-ref>
npx supabase db push

# 5. Correr en desarrollo
npm run dev
```

## Deploy en Vercel

1. Hacer push del repositorio a GitHub
2. Importar el proyecto en [vercel.com](https://vercel.com)
3. Configurar las siguientes variables de entorno en Vercel:

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima pública de Supabase |
| `NEXT_PUBLIC_APP_URL` | URL de producción (ej: `https://fauu-tracker.vercel.app`) |

4. En el Dashboard de Supabase → Authentication → URL Configuration:
   - **Site URL**: `https://fauu-tracker.vercel.app`
   - **Redirect URLs**: `https://fauu-tracker.vercel.app/**`

5. Vercel detecta Next.js automáticamente — no requiere configuración adicional.

## Notificaciones por email (Edge Function)

La función `check-vencimientos` debe deployarse por separado:

```bash
npx supabase functions deploy check-vencimientos
```

Luego configurar un cron job en Supabase (Dashboard → Edge Functions → Schedules) para que se ejecute diariamente.

---

Desarrollado por **Teo Risso** — Estudiante y desarrollador · FAU-UNNE
