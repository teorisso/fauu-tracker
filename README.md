# FAUU Tracker

Seguimiento de progreso académico para la carrera de Arquitectura Plan 2018 — FAU UNNE.

## Funcionalidades

- Dashboard de materias con estados (sin cursar, cursando, regular, aprobada)
- Importación desde SIU Guaraní (`historia_academica.xls`)
- Control de vencimientos de regularidad con **alertas configurables** (correo y/o notificación del navegador)
- Recordatorios para **mesas en las que te anotaste** (próxima fecha por materia)
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
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clave **pública** VAPID para Web Push (ver abajo) |

4. En el Dashboard de Supabase → Authentication → URL Configuration:
   - **Site URL**: `https://fauu-tracker.vercel.app`
   - **Redirect URLs**: `https://fauu-tracker.vercel.app/**`

5. Vercel detecta Next.js automáticamente — no requiere configuración adicional.

## Alertas (Edge Function `check-vencimientos`)

La función revisa **una vez al día** (cron en Supabase) vencimientos de regularidad y próximas mesas anotadas. Las reglas se guardan en `notification_preferences.alert_rules` (anticipación en **días** o **semanas**, canal **email** o **push**). Los envíos se deduplican con la tabla `notification_deliveries`.

### Zona horaria

Los “días hasta el evento” se calculan con la fecha civil en **`America/Argentina/Cordoba`**, alineado al uso en la UNNE (Resistencia, Chaco).

### Web Push (VAPID)

1. Generar un par de claves (en cualquier máquina con Node):

   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Vercel / `.env.local`**: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = clave pública.

3. **Supabase** (secrets de la Edge Function, no commitear):
   - `VAPID_PUBLIC_KEY` = misma clave pública
   - `VAPID_PRIVATE_KEY` = clave privada
   - `VAPID_SUBJECT` = `mailto:tu-email@ejemplo.com` (contacto del propietario del push)

4. Deploy de la función:

   ```bash
   npx supabase functions deploy check-vencimientos
   ```

5. **Cron**: en Supabase → Edge Functions → **Schedules**, programar `check-vencimientos` **diariamente** (hora según preferencia).

La clave privada **no** debe ir en el frontend; solo la pública (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`) para suscribir el navegador.

### Si falla “push service error” o el registro en el navegador

- En Vercel, el valor de `NEXT_PUBLIC_VAPID_PUBLIC_KEY` debe ser **una sola línea**, la Public Key completa, **sin comillas** ni espacios al inicio/final (si el panel agrega comillas al pegar, borralas).
- Tras crear o cambiar esa variable, hacé un **nuevo deploy** (las variables `NEXT_PUBLIC_*` se fijan en tiempo de build).
- La **misma** public key que en Vercel debe estar en Supabase como `VAPID_PUBLIC_KEY`, emparejada con su `VAPID_PRIVATE_KEY`.

---

Desarrollado por **Teo Risso** — Estudiante y desarrollador · FAU-UNNE
