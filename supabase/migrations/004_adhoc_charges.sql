-- Ad-hoc charges (manual payment due entries not tied to a run)
CREATE TABLE public.adhoc_charges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  notes text,
  paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_adhoc_charges_customer ON public.adhoc_charges(customer_id);
CREATE INDEX idx_adhoc_charges_paid ON public.adhoc_charges(paid);

ALTER TABLE public.adhoc_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Adhoc charges viewable by authenticated" ON public.adhoc_charges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert adhoc charges" ON public.adhoc_charges FOR INSERT TO authenticated WITH CHECK (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
CREATE POLICY "Admins can update adhoc charges" ON public.adhoc_charges FOR UPDATE TO authenticated USING (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
CREATE POLICY "Admins can delete adhoc charges" ON public.adhoc_charges FOR DELETE TO authenticated USING (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.adhoc_charges TO authenticated;
