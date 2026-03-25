-- Cambiar dias_anticipacion de integer a integer[] para permitir multiples alertas
ALTER TABLE public.notification_preferences
  DROP CONSTRAINT IF EXISTS notification_preferences_dias_anticipacion_check;

-- Quitar el default antes de cambiar el tipo
ALTER TABLE public.notification_preferences
  ALTER COLUMN dias_anticipacion DROP DEFAULT;

ALTER TABLE public.notification_preferences
  ALTER COLUMN dias_anticipacion TYPE integer[]
  USING ARRAY[COALESCE(dias_anticipacion, 60)];

ALTER TABLE public.notification_preferences
  ALTER COLUMN dias_anticipacion SET DEFAULT '{60}';
