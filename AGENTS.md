# AGENTS.md — FAUU Tracker

Tracker de progreso académico para Arquitectura (Plan 2018, FAU-UNNE).
Leé `SPEC.md` para la especificación completa y `README.md` para setup y deploy.

---

## Entorno de desarrollo

- Instalar dependencias con `npm install` (no se usa pnpm ni yarn).
- Correr en desarrollo con `npm run dev` (Next.js 14, App Router).
- Copiar `.env.local.example` → `.env.local` y completar las claves de Supabase antes de arrancar.
- Las variables `NEXT_PUBLIC_*` se inyectan en build-time; `VAPID_PUBLIC_KEY` (sin prefijo) se sirve en runtime vía `/api/vapid-public`.
- Si tocás migraciones o Edge Functions, necesitás `npx supabase login` y `npx supabase link --project-ref <ref>`.

## Arquitectura del proyecto

```
app/
├── (auth)/          → login (Google OAuth / magic link) y callback
├── (app)/           → rutas protegidas: dashboard de materias, calendario, perfil
├── api/             → route handlers (calendario-fau, mesas-fau, vapid-public)
├── page.tsx         → landing page pública
└── layout.tsx       → root layout con ThemeProvider

components/
├── materias/        → MateriaCard, EstadoMenu, NotaModal, CicloSection
├── stats/           → StatsPanel, BarraProgreso, ProyeccionEgreso
├── seminarios/      → SeminarioCard (optativos configurables)
├── gamification/    → logros, heatmap, ShareCard (generación de imágenes)
├── easter-egg/      → celebración al completar la carrera
├── calendario/      → calendario de mesas de examen
├── guarani/         → importación desde SIU Guaraní (.xls)
├── perfil/          → configuración, export/import, notificaciones
├── auth/            → componentes de login
└── ui/              → primitivos shadcn/ui

lib/
├── data/            → datos estáticos del plan (materias.ts, correlatividades.ts)
├── logic/           → funciones puras: correlatividades, promedios, proyección,
│                      vencimientos, logros, parser de Guaraní, scraper de mesas
├── supabase/        → clients (browser, server, middleware)
├── hooks/           → hooks custom de React
├── utils/           → utilidades auxiliares
└── types.ts         → tipos compartidos

supabase/
├── migrations/      → 001 a 009 (schema, notificaciones, mesas, alertas push)
└── functions/       → check-vencimientos (Edge Function, cron diario)
```

## Convenciones de código

- **TypeScript estricto** en todo el proyecto. No usar `any`; preferir tipos explícitos.
- **Estilos**: Tailwind CSS + shadcn/ui. No escribir CSS custom salvo en `globals.css`.
- **Componentes**: usar `"use client"` solo cuando sea necesario (eventos, hooks de estado). Los Server Components son el default.
- **Supabase**:
  - Usar `createClient()` de `lib/supabase/client.ts` en componentes client.
  - Usar `createClient()` de `lib/supabase/server.ts` en Server Components y Server Actions.
  - No exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente nunca.
  - No hacer mutations directas desde componentes client para operaciones críticas — usar Server Actions.
- **Optimistic updates**: actualizar UI inmediatamente, revertir con toast si falla la sincronización.
- **Imports**: usar alias `@/` (configurado en `tsconfig.json`).

## Datos estáticos vs. base de datos

- El plan de estudios (materias, correlatividades, horas) está **hardcodeado** en `lib/data/`. No se almacena en la DB.
- La DB solo guarda el **estado del estudiante**: progreso de materias, seminarios, preferencias, mesas anotadas.
- Las correlatividades son advertencias, no bloqueos. La validación corre en el cliente con funciones puras.

## Base de datos (Supabase / PostgreSQL)

- Todas las tablas usan **Row Level Security (RLS)**. Cada usuario solo accede a sus propios datos.
- Al crear una tabla nueva, siempre activar RLS y agregar policies restrictivas.
- Las migraciones viven en `supabase/migrations/` con numeración secuencial (`00X_nombre.sql`).
- Para aplicar migraciones: `npx supabase db push`.
- Para crear una migración nueva: `npx supabase migration new <nombre>`.
- Trigger `handle_new_user()` crea el perfil automáticamente al registrarse vía Auth.
- Trigger `update_updated_at()` mantiene `materia_estados.updated_at` sincronizado.

## Edge Functions

- Ubicación: `supabase/functions/<nombre>/`.
- La función `check-vencimientos` corre como **cron diario** y maneja alertas de vencimientos y mesas.
- Los secrets (VAPID keys, etc.) se configuran en Supabase Dashboard, no se commitean.
- Deploy: `npx supabase functions deploy <nombre>`.

## Linting y build

- ESLint: `npm run lint` (hereda `next/core-web-vitals` y `next/typescript`).
- Build de producción: `npm run build`. La build de Vercel **falla** si hay errores de ESLint o TypeScript.
- Preferir `const` sobre `let` cuando la variable no se reasigna (`prefer-const`).
- Corregir todos los errores de lint y tipos antes de hacer push.

## Deploy

- **Plataforma**: Vercel (detecta Next.js automáticamente).
- Las variables de entorno van en el dashboard de Vercel (ver tabla en `README.md`).
- En Supabase Dashboard → Authentication → URL Configuration: configurar Site URL y Redirect URLs.
- Cada push a la rama principal dispara un deploy automático.

## Paleta de diseño

| Token              | Valor       | Uso                              |
|---------------------|-------------|----------------------------------|
| Azul oscuro         | `#1e3a5f`   | Primario, fondo de header        |
| Amarillo            | `#f5c842`   | Warnings, regular vigente        |
| Verde               | `#2d6a4f`   | Aprobadas, éxito                 |
| Fondo gris claro    | —           | sin_cursar                       |
| Azul claro          | —           | cursando                         |
| Rojo claro          | —           | regular_vencida                  |
| Verde oscuro        | —           | final_aprobado (texto blanco)    |

- Tipografía: Inter (sans-serif).
- Animaciones de cambio de estado: 150ms ease.
- Tema claro/oscuro soportado vía `next-themes`.

## Lo que NO hacer

- No usar `useEffect` para sincronización en cadena.
- No bloquear el render esperando datos de Supabase — usar loading states.
- No inventar correlatividades que no estén en `SPEC.md`.
- No calcular el promedio con aplazos (solo notas aprobadas).
- No commitear secrets (`.env.local` está en `.gitignore`).
