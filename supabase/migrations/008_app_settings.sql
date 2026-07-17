-- App settings (single row, keyed by id=1)
CREATE TABLE public.app_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  target_turnover_one numeric(10,2) NOT NULL DEFAULT 200,
  target_turnover_two numeric(10,2) NOT NULL DEFAULT 340,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO public.app_settings (id, target_turnover_one, target_turnover_two) VALUES (1, 200, 340);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings viewable by authenticated"
  ON public.app_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update settings"
  ON public.app_settings FOR UPDATE TO authenticated
  USING (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

GRANT SELECT, UPDATE ON public.app_settings TO authenticated;
