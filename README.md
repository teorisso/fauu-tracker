# FAUU Tracker

Seguimiento de progreso académico para la carrera de Arquitectura Plan 2018 — FAU UNNE.

## Funcionalidades

- Dashboard de materias con estados (sin cursar, cursando, regular, aprobada)
- Importación desde SIU Guaraní (`historia_academica.xls`)
- Control de vencimientos de regularidad con **alertas configurables** (correo y/o notificación del navegador)
- Recordatorios para **mesas en las que te anotaste** (próxima fecha por materia)
- Calendario de mesas de examen 2026 con inscripción planificada
- Seminarios optativos configurables
- **Gamificación**: logros desbloqueables, heatmap de actividad, compartir hitos como imagen
- **Términos y Condiciones** con consentimiento explícito al ingresar
- **Eliminación de cuenta** con borrado completo en cascada
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
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (necesaria para `deleteAccount` y la Edge Function) |
| `VAPID_PUBLIC_KEY` | Clave **pública** VAPID (recomendada; se sirve en runtime vía `/api/vapid-public`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Alternativa: misma clave pública (se inyecta al build; si falla el push, usá `VAPID_PUBLIC_KEY`) |

4. En el Dashboard de Supabase → Authentication → URL Configuration:
   - **Site URL**: `https://fauu-tracker.vercel.app`
   - **Redirect URLs**: `https://fauu-tracker.vercel.app/**`

5. Vercel detecta Next.js automáticamente — no requiere configuración adicional.

## Branding gratis de Google Login

Podés mejorar la confianza visual del inicio de sesión con Google sin costo, aunque manteniendo el dominio por defecto de Supabase.

1. En Google Cloud Console, abrí **APIs & Services → OAuth consent screen**.
2. Configurá estos campos:
   - **App name** (ej. `FAUU Tracker`)
   - **App logo**
   - **User support email**
   - **Developer contact information**
3. Guardá y publicá los cambios de la pantalla de consentimiento.
4. Verificá en el login que se muestre el nombre y logo correcto de tu app.

### Limitación en plan gratuito

En el selector de cuenta de Google puede seguir apareciendo `*.supabase.co` (por ejemplo `fwebpajsdovqxudxnuky.supabase.co`) porque ese es el dominio de callback OAuth del proyecto Supabase en plan gratis.

### Checklist rápido (sin costo)

- Nombre de app consistente: `FAUU Tracker` en Google Cloud y en la UI del sitio.
- Logo cargado en OAuth consent screen.
- Email de soporte visible y vigente.
- Aviso en pantalla de login indicando que puede verse `*.supabase.co`.

## Alertas (Edge Function `check-vencimientos`)

La función revisa **una vez al día** (cron en Supabase) vencimientos de regularidad y próximas mesas anotadas. Las reglas se guardan en `notification_preferences.alert_rules` (anticipación en **días** o **semanas**, canal **email** o **push**). Los envíos se deduplican con la tabla `notification_deliveries`.

### Zona horaria

Los “días hasta el evento” se calculan con la fecha civil en **`America/Argentina/Cordoba`**, alineado al uso en la UNNE (Resistencia, Chaco).

### Web Push (VAPID)

1. Generar un par de claves (en cualquier máquina con Node):

   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Vercel / `.env.local`**: definí **`VAPID_PUBLIC_KEY`** = clave pública (recomendado; no depende del build del bundle). Podés usar también `NEXT_PUBLIC_VAPID_PUBLIC_KEY` como respaldo.

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

- En Vercel, agregá **`VAPID_PUBLIC_KEY`** (recomendado) con la Public Key en **una sola línea**, sin comillas. El cliente la obtiene por `/api/vapid-public` y evita problemas de variables `NEXT_PUBLIC_*` mal inyectadas al build.
- Si solo usás `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, hacé **redeploy** tras cada cambio (se fija en tiempo de build).
- La **misma** public key debe estar en Supabase como `VAPID_PUBLIC_KEY` (secrets de la Edge Function), emparejada con `VAPID_PRIVATE_KEY`.

#### Matriz rápida por navegador

| Escenario | Comportamiento esperado | Qué revisar |
| --- | --- | --- |
| Chrome (ventana normal) | Debe permitir activar push | Permiso del sitio en `Permitir` |
| Chrome incógnito | Puede aparecer bloqueado/no permitido | Probar en ventana normal |
| Brave | Puede fallar con `push service error` aun con permiso concedido | Abrir `brave://settings/privacy` y activar `Use Google services for push messaging` |
| Cualquier navegador sin HTTPS | Push no funciona | Verificar que la URL sea `https://...` (o `localhost` en desarrollo) |

---

Desarrollado por **Teo Risso** — Estudiante y desarrollador · FAU-UNNE
