-- Nuevas columnas para tracking de fechas y vencimientos
ALTER TABLE public.materia_estados
  ADD COLUMN IF NOT EXISTS fecha_regularidad date,
  ADD COLUMN IF NOT EXISTS fecha_aprobacion date,
  ADD COLUMN IF NOT EXISTS vencimiento_regularidad date;

-- Comentarios descriptivos
COMMENT ON COLUMN public.materia_estados.fecha_regularidad IS 'Fecha en que se obtuvo la regularidad (de historia academica)';
COMMENT ON COLUMN public.materia_estados.fecha_aprobacion IS 'Fecha en que se aprobo el final o se promociono';
COMMENT ON COLUMN public.materia_estados.vencimiento_regularidad IS 'Fecha de vencimiento de la regularidad (ingresada manualmente por el usuario desde el SIU)';
