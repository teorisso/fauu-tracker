-- Preferencias de notificacion por email
CREATE TABLE public.notification_preferences (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  email_vencimientos boolean DEFAULT true,
  dias_anticipacion integer DEFAULT 60 CHECK (dias_anticipacion IN (30, 60, 90)),
  ultimo_email_enviado timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios ven sus preferencias"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "usuarios modifican sus preferencias"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id);
