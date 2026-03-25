-- Ampliar las opciones de dias_anticipacion para notificaciones (agregar 120 y 180 dias)
ALTER TABLE public.notification_preferences
  DROP CONSTRAINT IF EXISTS notification_preferences_dias_anticipacion_check;

ALTER TABLE public.notification_preferences
  ADD CONSTRAINT notification_preferences_dias_anticipacion_check
  CHECK (dias_anticipacion IN (30, 60, 90, 120, 180));
