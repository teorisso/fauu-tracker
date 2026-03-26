-- Tabla para almacenar mesas de examen de años futuros (cargadas manualmente)
-- Los datos de 2026 están hardcodeados en calendario-academico.ts
-- Esta tabla es para 2027 en adelante.

CREATE TABLE IF NOT EXISTS public.mesas_custom (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  anio integer NOT NULL CHECK (anio >= 2027),
  materia_id text NOT NULL,
  nombre_oficial text NOT NULL,
  dia_semana text NOT NULL CHECK (dia_semana IN ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado')),
  hora text NOT NULL,
  aula text,
  turno_numero integer NOT NULL CHECK (turno_numero BETWEEN 1 AND 7),
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, anio, materia_id, turno_numero)
);

-- Activar RLS
ALTER TABLE public.mesas_custom ENABLE ROW LEVEL SECURITY;

-- Cada usuario sólo ve y modifica sus propias mesas custom
CREATE POLICY "mesas_custom_user_select" ON public.mesas_custom
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mesas_custom_user_insert" ON public.mesas_custom
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mesas_custom_user_update" ON public.mesas_custom
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "mesas_custom_user_delete" ON public.mesas_custom
  FOR DELETE USING (auth.uid() = user_id);

-- Índice para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS mesas_custom_user_anio_idx ON public.mesas_custom (user_id, anio);
