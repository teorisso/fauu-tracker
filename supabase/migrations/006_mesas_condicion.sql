-- Agregar columna condicion a mesas_usuario para distinguir regular vs libre
ALTER TABLE public.mesas_usuario
  ADD COLUMN IF NOT EXISTS condicion text DEFAULT 'regular'
  CHECK (condicion IN ('regular', 'libre'));
