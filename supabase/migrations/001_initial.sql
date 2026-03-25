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
  materia_id text not null,
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
