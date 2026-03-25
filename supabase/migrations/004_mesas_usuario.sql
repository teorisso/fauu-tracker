-- Mesas de examen personalizadas del usuario
CREATE TABLE public.mesas_usuario (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  materia_id text NOT NULL,
  fecha date NOT NULL,
  turno_numero integer,
  anotado boolean DEFAULT false,
  notas text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, materia_id, fecha)
);

ALTER TABLE public.mesas_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios ven sus mesas"
  ON public.mesas_usuario FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "usuarios modifican sus mesas"
  ON public.mesas_usuario FOR ALL
  USING (auth.uid() = user_id);
