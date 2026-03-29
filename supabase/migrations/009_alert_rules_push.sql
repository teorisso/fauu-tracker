-- Reemplazo de preferencias legacy por alert_rules + tablas push y entregas

-- 1) notification_preferences: eliminar columnas viejas y agregar alert_rules
ALTER TABLE public.notification_preferences
  DROP COLUMN IF EXISTS email_vencimientos,
  DROP COLUMN IF EXISTS dias_anticipacion,
  DROP COLUMN IF EXISTS ultimo_email_enviado;

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS alert_rules jsonb NOT NULL DEFAULT '[
    {"scope":"regularidad","channel":"email","amount":60,"unit":"days"}
  ]'::jsonb;

COMMENT ON COLUMN public.notification_preferences.alert_rules IS
  'Reglas de alerta: scope regularidad|mesa, channel email|push, amount, unit days|weeks';

-- 2) Suscripciones Web Push
CREATE TABLE public.push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX push_subscriptions_user_id_idx ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios ven sus push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "usuarios insertan sus push subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usuarios actualizan sus push subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "usuarios borran sus push subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- 3) Idempotencia de envíos (Edge Function con service role)
CREATE TABLE public.notification_deliveries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('regularidad', 'mesa')),
  event_key text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'push')),
  lead_days integer NOT NULL CHECK (lead_days > 0),
  sent_at timestamptz DEFAULT now(),
  UNIQUE (user_id, scope, event_key, channel, lead_days)
);

CREATE INDEX notification_deliveries_user_idx ON public.notification_deliveries (user_id);

ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

-- Sin políticas para usuarios: solo lectura propia opcional para debugging
CREATE POLICY "usuarios ven sus entregas"
  ON public.notification_deliveries FOR SELECT
  USING (auth.uid() = user_id);
