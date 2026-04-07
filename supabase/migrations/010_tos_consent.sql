-- Agrega campo de consentimiento de T&C al perfil del usuario
-- NULL = usuario existente que aún no aceptó explícitamente
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tos_accepted_at timestamptz;

COMMENT ON COLUMN public.profiles.tos_accepted_at IS 'Timestamp en que el usuario aceptó los Términos y Condiciones. NULL si aún no lo hizo.';
