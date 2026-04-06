# SPEC.md — Tracker de Carrera Arquitectura FAU-UNNE

## Descripción del proyecto
Aplicación web para que estudiantes de Arquitectura de la UNNE (Plan 2018)
hagan seguimiento de su progreso académico. Cada estudiante tiene su cuenta,
su progreso se guarda en la nube y puede acceder desde cualquier dispositivo.

## Stack tecnológico
- **Framework:** Next.js 14 con App Router
- **Lenguaje:** TypeScript estricto en todo el proyecto
- **Base de datos y auth:** Supabase (PostgreSQL + Supabase Auth + Edge Functions)
- **Estilos:** Tailwind CSS
- **Componentes:** shadcn/ui como base
- **Deploy:** Vercel

## Estructura de archivos
```
/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          → landing + login (Google OAuth, magic link)
│   │   └── callback/
│   │       └── route.ts          → callback de auth
│   ├── (app)/
│   │   ├── layout.tsx            → layout con header y nav
│   │   ├── materias/
│   │   │   └── page.tsx          → dashboard principal con las materias
│   │   ├── calendario/
│   │   │   ├── page.tsx          → calendario de mesas de examen
│   │   │   └── gestionar/        → gestión de mesas personalizadas
│   │   └── perfil/
│   │       └── page.tsx          → importación Guaraní, vencimientos, notificaciones, gamificación
│   ├── api/
│   │   ├── calendario-fau/       → scraping del calendario académico FAU
│   │   ├── mesas-fau/            → scraping de mesas de examen FAU
│   │   └── vapid-public/         → endpoint para clave pública VAPID (runtime)
│   ├── page.tsx                  → landing page pública
│   └── layout.tsx                → root layout con ThemeProvider
├── components/
│   ├── materias/
│   │   ├── MateriaCard.tsx       → card de materia con estado visual
│   │   ├── EstadoMenu.tsx        → menú contextual flotante de estados
│   │   ├── NotaModal.tsx         → modal para cargar nota y fecha
│   │   ├── CicloSection.tsx      → agrupa cards por año/ciclo
│   │   ├── CorrelativaWarning.tsx → banner de advertencia de correlatividades
│   │   └── Leyenda.tsx           → leyenda de colores por estado
│   ├── stats/
│   │   ├── StatsPanel.tsx        → panel completo: progreso, horas, promedio, proyección, ciclos
│   │   └── ProximosExamenes.tsx  → sugerencia de próximas mesas
│   ├── seminarios/
│   │   └── SeminarioCard.tsx     → card editable para optativos
│   ├── gamification/
│   │   ├── LogrosPanel.tsx       → panel de logros desbloqueados
│   │   ├── LogroToast.tsx        → notificación al desbloquear logro
│   │   ├── HeatmapActividad.tsx  → heatmap mensual de actividad
│   │   ├── ShareCard.tsx         → generación de imagen para compartir hitos
│   │   └── PerfilGamification.tsx → sección de gamificación en perfil
│   ├── calendario/
│   │   ├── CalendarioMesas.tsx    → vista del calendario de mesas
│   │   ├── CalendarioPageClient.tsx
│   │   ├── CalendarMonthGrid.tsx  → grilla mensual
│   │   ├── CalendarTimeline.tsx   → vista timeline
│   │   ├── CalendarViewToggle.tsx → toggle entre vistas
│   │   └── GestionarCalendarioClient.tsx → gestión de mesas custom
│   ├── guarani/
│   │   ├── GuaraniImport.tsx     → importación desde SIU Guaraní (.xls)
│   │   └── VencimientoEditor.tsx → editor de fechas de vencimiento
│   ├── perfil/
│   │   └── NotificationPrefs.tsx → configuración de alertas (email + push)
│   ├── auth/
│   │   └── LogoutButton.tsx
│   ├── easter-egg/               → (pendiente de implementar)
│   ├── ui/                       → primitivos shadcn/ui
│   ├── DashboardClient.tsx       → cliente del dashboard de materias
│   ├── CountdownBanner.tsx       → banner de cuenta regresiva
│   ├── NavLinks.tsx              → links de navegación
│   ├── ThemeProvider.tsx         → provider de tema claro/oscuro
│   ├── ThemeToggle.tsx           → switch de tema
│   └── AppFooter.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             → supabase browser client
│   │   ├── server.ts             → supabase server client
│   │   └── middleware.ts         → refresh de sesión
│   ├── data/
│   │   ├── materias.ts           → datos estáticos del plan (33 materias)
│   │   ├── correlatividades.ts   → reglas hardcodeadas del plan
│   │   ├── calendario-academico.ts → fechas del calendario académico
│   │   ├── guaraniCodeMap.ts     → mapeo de códigos Guaraní → IDs internos
│   │   └── mesa-name-map.ts     → mapeo de nombres de mesas del scraper
│   ├── logic/
│   │   ├── correlatividades.ts   → funciones puras de validación
│   │   ├── promedios.ts          → cálculo de promedios y horas
│   │   ├── proyeccion.ts         → estimación de egreso
│   │   ├── vencimientos.ts       → lógica de vencimientos de regularidad
│   │   ├── logros.ts             → sistema de logros (gamificación)
│   │   ├── guaraniParser.ts      → parser de archivos .xls de Guaraní
│   │   ├── mesasScraper.ts       → scraper de mesas de examen FAU
│   │   └── planificacion.ts      → lógica de planificación académica
│   ├── hooks/
│   │   └── useMaterias.ts        → hook para gestión de estados de materias
│   ├── utils/
│   │   └── ics-generator.ts      → generador de archivos .ics (calendario)
│   ├── types.ts                  → tipos compartidos
│   ├── estado-utils.ts           → utilidades de estados
│   ├── notifications.ts          → utilidades de notificaciones
│   ├── push-client.ts            → cliente Web Push (VAPID)
│   └── utils.ts                  → utilidades generales (cn)
├── supabase/
│   ├── migrations/               → 001 a 009 (schema, notificaciones, mesas, push)
│   └── functions/
│       └── check-vencimientos/   → Edge Function: cron diario de alertas
├── public/
│   ├── sw.js                     → service worker para push notifications
│   ├── robots.txt
│   └── llms.txt
├── middleware.ts                  → protección de rutas con Supabase Auth
└── SPEC.md                       → este archivo
```

---

## Base de datos — Schema completo

### Principios del schema
- Usar Row Level Security (RLS) en todas las tablas
- Cada usuario solo puede leer y escribir sus propios datos
- Los datos del plan de estudios son estáticos en el código, no en la DB
- La DB solo guarda el estado del estudiante

### Tablas
```sql
-- Perfil extendido del usuario (complementa auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nombre_completo text,
  created_at timestamptz default now(),
  carrera_completada boolean default false,
  carrera_completada_at timestamptz
);

-- Estado de cada materia por usuario
create table public.materia_estados (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  materia_id text not null, -- coincide con el id en materias.ts
  estado text not null check (estado in (
    'sin_cursar',
    'cursando', 
    'regular_vigente',
    'regular_vencida',
    'promocionada',
    'final_aprobado'
  )),
  anio_cursado integer check (anio_cursado >= 2000 and anio_cursado <= 2099),
  cuatrimestre integer check (cuatrimestre in (1, 2)),
  nota numeric(3,1) check (nota >= 1 and nota <= 10),
  intentos_previos integer default 0 check (intentos_previos >= 0),
  updated_at timestamptz default now(),
  unique(user_id, materia_id)
);

-- Seminarios optativos (3 por usuario, configurables)
create table public.seminarios (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  numero integer not null check (numero in (1, 2, 3)),
  nombre text,
  area text check (area in (
    'tecnologia_produccion_gestion',
    'proyecto_planeamiento', 
    'comunicacion_forma',
    'ciencias_sociales_humanas'
  )),
  estado text not null default 'sin_cursar' check (estado in (
    'sin_cursar',
    'cursando',
    'regular_vigente', 
    'regular_vencida',
    'promocionada',
    'final_aprobado'
  )),
  anio_cursado integer,
  cuatrimestre integer check (cuatrimestre in (1, 2)),
  nota numeric(3,1) check (nota >= 1 and nota <= 10),
  unique(user_id, numero)
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.materia_estados enable row level security;
alter table public.seminarios enable row level security;

-- Profiles: el usuario solo ve y edita su propio perfil
create policy "usuarios ven su propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "usuarios editan su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Se crea automáticamente al registrarse
create policy "usuarios insertan su propio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Materia estados: el usuario solo accede a sus datos
create policy "usuarios ven sus materias"
  on public.materia_estados for select
  using (auth.uid() = user_id);

create policy "usuarios modifican sus materias"
  on public.materia_estados for all
  using (auth.uid() = user_id);

-- Seminarios: igual
create policy "usuarios ven sus seminarios"
  on public.seminarios for select
  using (auth.uid() = user_id);

create policy "usuarios modifican sus seminarios"
  on public.seminarios for all
  using (auth.uid() = user_id);

-- Trigger: crear perfil automáticamente cuando se registra un usuario
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger: actualizar updated_at automáticamente
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger materia_estados_updated_at
  before update on public.materia_estados
  for each row execute function update_updated_at();
```

---

## Datos estáticos del plan (lib/data/materias.ts)
```typescript
export type Estado =
  | 'sin_cursar'
  | 'cursando'
  | 'regular_vigente'
  | 'regular_vencida'
  | 'promocionada'
  | 'final_aprobado'

export type Ciclo =
  | 'introductorio'
  | 'formacion_disciplinar'
  | 'formacion_profesional'

export interface Materia {
  id: string
  nombre: string
  horasCatedra: number
  anio: 1 | 2 | 3 | 4 | 5 | 6
  ciclo: Ciclo
  esTFC?: boolean   // Trabajo Final de Carrera
  esPPA?: boolean   // Práctica Profesional Asistida
}

export const MATERIAS: Materia[] = [
  // 1er año - Ciclo Introductorio
  { id: 'curso_ingreso', nombre: 'Curso de Ingreso', horasCatedra: 60, anio: 1, ciclo: 'introductorio' },
  { id: 'arquitectura_1', nombre: 'Arquitectura I', horasCatedra: 196, anio: 1, ciclo: 'introductorio' },
  { id: 'sistemas_representacion', nombre: 'Sistemas de Representación y Expresión', horasCatedra: 140, anio: 1, ciclo: 'introductorio' },
  { id: 'ciencias_basicas', nombre: 'Ciencias Básicas Aplicadas al Diseño', horasCatedra: 84, anio: 1, ciclo: 'introductorio' },
  { id: 'intro_tecnologia', nombre: 'Introducción a la Tecnología', horasCatedra: 140, anio: 1, ciclo: 'introductorio' },
  { id: 'intro_diseno', nombre: 'Introducción al Diseño', horasCatedra: 70, anio: 1, ciclo: 'introductorio' },

  // 2do año - Ciclo Formación Disciplinar
  { id: 'arquitectura_2', nombre: 'Arquitectura II', horasCatedra: 196, anio: 2, ciclo: 'formacion_disciplinar' },
  { id: 'morfologia_1', nombre: 'Morfología I', horasCatedra: 112, anio: 2, ciclo: 'formacion_disciplinar' },
  { id: 'construcciones_1', nombre: 'Construcciones I', horasCatedra: 70, anio: 2, ciclo: 'formacion_disciplinar' },
  { id: 'estructuras_1', nombre: 'Estructuras I', horasCatedra: 70, anio: 2, ciclo: 'formacion_disciplinar' },
  { id: 'instalaciones_1', nombre: 'Instalaciones I', horasCatedra: 70, anio: 2, ciclo: 'formacion_disciplinar' },
  { id: 'historia_critica_1', nombre: 'Historia y Crítica I', horasCatedra: 70, anio: 2, ciclo: 'formacion_disciplinar' },
  { id: 'teoria_diseno_1', nombre: 'Teoría del Diseño Arquitectónico I', horasCatedra: 70, anio: 2, ciclo: 'formacion_disciplinar' },

  // 3er año
  { id: 'arquitectura_3', nombre: 'Arquitectura III', horasCatedra: 196, anio: 3, ciclo: 'formacion_disciplinar' },
  { id: 'morfologia_2', nombre: 'Morfología II', horasCatedra: 112, anio: 3, ciclo: 'formacion_disciplinar' },
  { id: 'construcciones_2', nombre: 'Construcciones II', horasCatedra: 70, anio: 3, ciclo: 'formacion_disciplinar' },
  { id: 'estructuras_2', nombre: 'Estructuras II', horasCatedra: 70, anio: 3, ciclo: 'formacion_disciplinar' },
  { id: 'instalaciones_2', nombre: 'Instalaciones II', horasCatedra: 70, anio: 3, ciclo: 'formacion_disciplinar' },
  { id: 'historia_critica_2', nombre: 'Historia y Crítica II', horasCatedra: 70, anio: 3, ciclo: 'formacion_disciplinar' },
  { id: 'intro_urbanismo', nombre: 'Introducción al Urbanismo y al Planeamiento', horasCatedra: 70, anio: 3, ciclo: 'formacion_disciplinar' },

  // 4to año
  { id: 'arquitectura_4', nombre: 'Arquitectura IV', horasCatedra: 196, anio: 4, ciclo: 'formacion_disciplinar' },
  { id: 'construcciones_3', nombre: 'Construcciones III', horasCatedra: 90, anio: 4, ciclo: 'formacion_disciplinar' },
  { id: 'estructuras_3', nombre: 'Estructuras III', horasCatedra: 84, anio: 4, ciclo: 'formacion_disciplinar' },
  { id: 'instalaciones_3', nombre: 'Instalaciones III', horasCatedra: 78, anio: 4, ciclo: 'formacion_disciplinar' },
  { id: 'urbanismo', nombre: 'Urbanismo', horasCatedra: 84, anio: 4, ciclo: 'formacion_disciplinar' },
  { id: 'historia_critica_3', nombre: 'Historia y Crítica III', horasCatedra: 70, anio: 4, ciclo: 'formacion_disciplinar' },
  { id: 'teoria_diseno_2', nombre: 'Teoría del Diseño Arquitectónico II', horasCatedra: 70, anio: 4, ciclo: 'formacion_disciplinar' },

  // 5to año - Ciclo Formación Profesional
  { id: 'arquitectura_5', nombre: 'Arquitectura V', horasCatedra: 235, anio: 5, ciclo: 'formacion_profesional' },
  { id: 'organizacion_produccion_obras', nombre: 'Organización y Producción de Obras', horasCatedra: 84, anio: 5, ciclo: 'formacion_profesional' },
  { id: 'planeamiento_territorial', nombre: 'Planeamiento y Ordenamiento Territorial', horasCatedra: 84, anio: 5, ciclo: 'formacion_profesional' },
  { id: 'gestion_habitat_social', nombre: 'Gestión y Producción del Hábitat Social', horasCatedra: 84, anio: 5, ciclo: 'formacion_profesional' },

  // 6to año
  { id: 'tfc', nombre: 'Trabajo Final de Carrera', horasCatedra: 235, anio: 6, ciclo: 'formacion_profesional', esTFC: true },
  { id: 'ppa', nombre: 'Práctica Profesional Asistida', horasCatedra: 140, anio: 6, ciclo: 'formacion_profesional', esPPA: true },
  { id: 'org_legislacion_gestion', nombre: 'Organización, Legislación y Gestión Profesional', horasCatedra: 112, anio: 6, ciclo: 'formacion_profesional' },
]

export const HORAS_TOTALES_OBLIGATORIAS = 3592
export const HORAS_OPTATIVAS = 210
```

---

## Reglas de correlatividades (lib/data/correlatividades.ts)
```typescript
// "aprobada" = final_aprobado o promocionada
// "regularizada" = regular_vigente, final_aprobado, o promocionada

export interface Correlativa {
  materiaId: string
  condicion: 'aprobada' | 'regularizada'
}

export interface ReglaCorrelatividad {
  materiaId: string
  paraPoderCursar: Correlativa[]
  requiereAnioCompleto?: number // si necesita "Xer año completo"
}

export const CORRELATIVIDADES: ReglaCorrelatividad[] = [
  // 2do año
  {
    materiaId: 'arquitectura_2',
    paraPoderCursar: [
      { materiaId: 'arquitectura_1', condicion: 'aprobada' },
      { materiaId: 'sistemas_representacion', condicion: 'aprobada' },
    ],
  },
  {
    materiaId: 'morfologia_1',
    paraPoderCursar: [
      { materiaId: 'arquitectura_1', condicion: 'aprobada' },
      { materiaId: 'sistemas_representacion', condicion: 'aprobada' },
    ],
  },
  {
    materiaId: 'estructuras_1',
    paraPoderCursar: [
      { materiaId: 'ciencias_basicas', condicion: 'regularizada' },
      { materiaId: 'intro_tecnologia', condicion: 'regularizada' },
      { materiaId: 'sistemas_representacion', condicion: 'aprobada' },
    ],
  },
  {
    materiaId: 'instalaciones_1',
    paraPoderCursar: [
      { materiaId: 'ciencias_basicas', condicion: 'regularizada' },
      { materiaId: 'intro_tecnologia', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'construcciones_1',
    paraPoderCursar: [
      { materiaId: 'sistemas_representacion', condicion: 'aprobada' },
      { materiaId: 'ciencias_basicas', condicion: 'regularizada' },
      { materiaId: 'intro_tecnologia', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'teoria_diseno_1',
    paraPoderCursar: [
      { materiaId: 'intro_diseno', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'historia_critica_1',
    paraPoderCursar: [
      { materiaId: 'sistemas_representacion', condicion: 'aprobada' },
      { materiaId: 'intro_diseno', condicion: 'regularizada' },
    ],
  },

  // 3er año
  {
    materiaId: 'arquitectura_3',
    requiereAnioCompleto: 1,
    paraPoderCursar: [
      { materiaId: 'arquitectura_2', condicion: 'aprobada' },
      { materiaId: 'morfologia_1', condicion: 'aprobada' },
    ],
  },
  {
    materiaId: 'morfologia_2',
    paraPoderCursar: [
      { materiaId: 'arquitectura_2', condicion: 'aprobada' },
      { materiaId: 'morfologia_1', condicion: 'aprobada' },
    ],
  },
  {
    materiaId: 'estructuras_2',
    paraPoderCursar: [
      { materiaId: 'estructuras_1', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'instalaciones_2',
    paraPoderCursar: [
      { materiaId: 'instalaciones_1', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'construcciones_2',
    paraPoderCursar: [
      { materiaId: 'construcciones_1', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'historia_critica_2',
    paraPoderCursar: [
      { materiaId: 'historia_critica_1', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'intro_urbanismo',
    paraPoderCursar: [
      { materiaId: 'historia_critica_1', condicion: 'regularizada' },
    ],
  },

  // 4to año
  {
    materiaId: 'arquitectura_4',
    requiereAnioCompleto: 2,
    paraPoderCursar: [
      { materiaId: 'arquitectura_3', condicion: 'aprobada' },
      { materiaId: 'morfologia_2', condicion: 'aprobada' },
    ],
  },
  {
    materiaId: 'estructuras_3',
    paraPoderCursar: [
      { materiaId: 'estructuras_2', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'instalaciones_3',
    paraPoderCursar: [
      { materiaId: 'instalaciones_1', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'construcciones_3',
    paraPoderCursar: [
      { materiaId: 'construcciones_2', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'urbanismo',
    paraPoderCursar: [
      { materiaId: 'intro_urbanismo', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'historia_critica_3',
    paraPoderCursar: [
      { materiaId: 'historia_critica_2', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'teoria_diseno_2',
    paraPoderCursar: [
      { materiaId: 'teoria_diseno_1', condicion: 'regularizada' },
    ],
  },

  // 5to año
  {
    materiaId: 'arquitectura_5',
    requiereAnioCompleto: 3,
    paraPoderCursar: [
      { materiaId: 'arquitectura_4', condicion: 'aprobada' },
    ],
  },
  {
    materiaId: 'planeamiento_territorial',
    paraPoderCursar: [
      { materiaId: 'urbanismo', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'gestion_habitat_social',
    requiereAnioCompleto: 3,
    paraPoderCursar: [],
  },
  {
    materiaId: 'organizacion_produccion_obras',
    requiereAnioCompleto: 3,
    paraPoderCursar: [],
  },

  // 6to año
  {
    materiaId: 'ppa',
    requiereAnioCompleto: 4,
    paraPoderCursar: [
      { materiaId: 'organizacion_produccion_obras', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'org_legislacion_gestion',
    requiereAnioCompleto: 4,
    paraPoderCursar: [
      { materiaId: 'organizacion_produccion_obras', condicion: 'regularizada' },
    ],
  },
  {
    materiaId: 'tfc',
    requiereAnioCompleto: 4,
    paraPoderCursar: [
      { materiaId: 'arquitectura_5', condicion: 'aprobada' },
      { materiaId: 'planeamiento_territorial', condicion: 'regularizada' },
      { materiaId: 'organizacion_produccion_obras', condicion: 'regularizada' },
    ],
  },
]
```

---

## Funcionalidades

### Autenticación
- Login con Google OAuth (Supabase lo maneja)
- Login con magic link por email (sin contraseña)
- Pantalla de login simple y limpia
- Redirect automático si ya está logueado
- Protección de rutas con middleware de Next.js

### Interacción con materias
Al hacer click en cualquier materia se abre un menú contextual flotante
con los estados disponibles. El menú debe:
- Posicionarse inteligentemente (no salirse de la pantalla)
- Cerrarse al hacer click fuera
- Mostrar el estado actual con un check
- Al seleccionar un estado que requiere datos adicionales
  (nota, año, cuatrimestre) abrir un modal secundario

### Validación de correlatividades
- Es una advertencia, no un bloqueo
- Aparece como un banner amarillo debajo de la card
- Muestra exactamente qué falta: "Falta: Estructuras I regularizada"
- La validación corre en el cliente con funciones puras (sin llamadas a la DB)

### Cálculo de "año completo"
Un año se considera "completo" cuando todas las materias de ese año
están en estado 'regularizada' o superior (regular_vigente, 
final_aprobado, promocionada).

### Panel de estadísticas
Sidebar fijo en desktop, colapsable en mobile (todo integrado en `StatsPanel.tsx`):
- Nombre del estudiante (editable inline)
- Barra de progreso general
- Materias aprobadas / total
- Horas acreditadas / 3592hs
- Promedio (solo materias con nota, sin aplazos)
- Proyección de egreso (si hay suficientes datos temporales)
- Regularidades próximas a vencer
- Próximos exámenes sugeridos
- Estado por ciclo (introductorio, disciplinar, profesional + optativos)
- Contador de logros desbloqueados

### Estadísticas: cálculo de proyección
Solo mostrar si el usuario tiene al menos 4 materias con
año_cursado registrado. Calcular: promedio de materias
aprobadas por año calendario, luego estimar cuántos años
faltan para completar las materias restantes.
Mostrar con honestidad: "Estimación aproximada basada en tu ritmo actual"

### Persistencia y sincronización
- Optimistic updates: actualizar UI inmediatamente, luego sincronizar con Supabase
- Si falla la sincronización, mostrar un toast de error y revertir
- Indicador visual sutil cuando hay cambios pendientes de sync

### Importación desde SIU Guaraní
- Importar historial académico desde el archivo `.xls` de Historia Académica del SIU Guaraní
- Parser automático de estados (aprobada, regular, etc.) con fechas exactas
- Mapeo de códigos de materia Guaraní a IDs internos (`lib/data/guaraniCodeMap.ts`)
- Tras importar, se pueden cargar fechas de vencimiento de regularidad

### Calendario de mesas de examen
- Calendario visual con turnos de examen del año en curso
- Vistas: grilla mensual y timeline
- Marcar mesas en las que te vas a inscribir
- Exportar mesas anotadas como archivo `.ics`
- Scraping automático de mesas desde la FAU
- Gestión de mesas custom (agregar/editar/eliminar)

### Alertas y notificaciones
- Reglas de alerta configurables: anticipación en días o semanas
- Canales: email y/o notificación push del navegador (Web Push / VAPID)
- Edge Function `check-vencimientos` como cron diario en Supabase
- Deduplicación de envíos con tabla `notification_deliveries`
- Zona horaria: `America/Argentina/Cordoba`

### Gamificación
- Sistema de logros desbloqueables por progreso académico
- Heatmap mensual de actividad
- Compartir hitos como imagen (generación con Canvas API)
- Toast de notificación al desbloquear un logro

### Export / Import JSON *(pendiente de implementar)*
- Export: descarga un JSON con todos los estados del usuario
- Import: sube un JSON y pregunta si quiere reemplazar o mergear
- El JSON debe ser legible (con nombres de materias, no solo IDs)

---

## Diseño visual
- Paleta: azul oscuro (#1e3a5f), blanco, gris claro, 
  amarillo (#f5c842) para warnings, verde (#2d6a4f) para aprobadas
- Tipografía: Inter o similar sans-serif
- Cards de materia: compactas, con color de fondo según estado
- Animación suave en cambio de estado (150ms ease)
- Estados visuales:
  - sin_cursar → fondo gris claro, texto gris
  - cursando → fondo azul claro, texto azul oscuro  
  - regular_vigente → fondo amarillo claro, texto amarillo oscuro
  - regular_vencida → fondo rojo claro, texto rojo oscuro
  - promocionada → fondo verde claro, texto verde oscuro
  - final_aprobado → fondo verde oscuro, texto blanco
- Mostrar nota en la card si está cargada (número grande y visible)
- Leyenda de estados visible en desktop, colapsable en mobile
- Tema claro/oscuro soportado vía `next-themes`

---

## Easter Egg *(pendiente de implementar)*

> **Estado:** el directorio `components/easter-egg/` existe pero está vacío.
> La tabla `profiles` ya tiene los campos `carrera_completada` y
> `carrera_completada_at` listos para usar.

Condición: cuando se registra la última materia obligatoria
como 'final_aprobado' o 'promocionada', incluyendo TFC, PPA
y Organización Legislación y Gestión Profesional.

Flujo planificado:
1. Modal de confirmación antes de guardar el último estado
2. Si confirma → guardar en DB → marcar profiles.carrera_completada = true
3. Disparar celebración:
   - Confetti con Canvas API (sin librerías externas)
   - Modal central con nombre del estudiante y promedio final
   - El header cambia a modo "graduado" con borde dorado
   - Se guarda en DB que ya se celebró (no repetir automáticamente)
4. Botón discreto "🎉 Revivir celebración" en la página de perfil

---

## Variables de entorno necesarias

Ver `.env.local.example` para la lista completa. Las principales:

```
NEXT_PUBLIC_SUPABASE_URL=        # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Clave anónima pública
NEXT_PUBLIC_APP_URL=             # URL pública de la app (para emails)
VAPID_PUBLIC_KEY=                # Clave pública VAPID (runtime, vía /api/vapid-public)
```

**Nota:** `SUPABASE_SERVICE_ROLE_KEY` solo se usa en la Edge Function
`check-vencimientos` (como secret de Supabase), no en `.env.local`.

---

## Lo que NO hacer
- No usar useEffect para sincronización en cadena
- No bloquear el render esperando datos de Supabase (usar loading states)
- No exponer la service role key al cliente
- No hacer llamadas a Supabase desde componentes de cliente directamente
  para mutations críticas — usar Server Actions
- No inventar correlatividades que no estén en este documento
- No calcular el promedio con aplazos (la lógica varía por reglamentación,
  solo mostrar promedio simple de notas aprobadas)

