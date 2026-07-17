-- Additional jobs/extras for a customer on a specific run (e.g. conservatory clean)
CREATE TABLE public.run_customer_extras (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id uuid NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  description text NOT NULL,
  price numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_run_customer_extras_run ON public.run_customer_extras(run_id);
CREATE INDEX idx_run_customer_extras_customer ON public.run_customer_extras(customer_id);
CREATE INDEX idx_run_customer_extras_run_customer ON public.run_customer_extras(run_id, customer_id);

ALTER TABLE public.run_customer_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Run customer extras viewable by authenticated"
  ON public.run_customer_extras FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert run customer extras"
  ON public.run_customer_extras FOR INSERT TO authenticated
  WITH CHECK (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

CREATE POLICY "Admins can update run customer extras"
  ON public.run_customer_extras FOR UPDATE TO authenticated
  USING (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

CREATE POLICY "Admins can delete run customer extras"
  ON public.run_customer_extras FOR DELETE TO authenticated
  USING (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.run_customer_extras TO authenticated;
